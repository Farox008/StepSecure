"""
main.py — Evizz Model Server  (FastAPI, port 8001)

Endpoints:
  GET  /api/model/health
  POST /api/model/register          Feature 2 — enrol person from N videos
  POST /api/model/test              Feature 3 — identify persons in a video
  GET  /api/model/gallery           List enrolled persons
  DELETE /api/model/gallery/{pid}  Remove person from gallery
  POST /api/model/streams/start     Feature 1 — start RTSP monitor
  POST /api/model/streams/stop      Stop a stream monitor
  GET  /api/model/streams           List active stream cameras
  GET  /api/model/alerts            Recent unknown-person alerts
  GET  /api/model/unknowns          Recent unknown sightings (pre-alert)
  POST /api/model/update-embedding  Feature 4 — manual incremental update
"""

import sys
import site
sys.path.insert(0, site.getusersitepackages())

import os
import asyncio
import uuid
from typing import List

from fastapi import FastAPI, File, Form, UploadFile, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from gallery import gallery
from alert import alert_manager
from tracker import StreamTracker
from pipeline import run_registration, run_test_pipeline
from clipper import save_tempfile
from embedder import embedder, average_embeddings, embedding_quality
from detector import detector

app = FastAPI(title="Evizz Model Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active RTSP stream trackers  {camera_id: StreamTracker}
_stream_trackers: dict = {}

# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/model/health")
async def health():
    return {
        "status":    "ok",
        "enrolled":  gallery.count(),
        "streams":   list(_stream_trackers.keys()),
        "alerts":    len(alert_manager.get_alerts()),
    }


# ── Feature 2: Registration ───────────────────────────────────────────────────

@app.post("/api/model/register")
async def register_person(
    name:       str         = Form(...),
    person_id:  str         = Form(None),
    videos:     List[UploadFile] = File(...),
):
    try:
        pid = person_id or str(uuid.uuid4())

        # Save uploaded videos to temp files
        temp_paths = []
        for upload in videos:
            data = await upload.read()
            ext  = os.path.splitext(upload.filename or "video.mp4")[1] or ".mp4"
            path = save_tempfile(data, suffix=ext)
            temp_paths.append(path)

        # Run registration in a thread (CPU-bound)
        loop   = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, run_registration, temp_paths, pid, name
        )

        # Cleanup temp files
        for p in temp_paths:
            try: os.remove(p)
            except: pass

        return result
    except Exception as e:
        import traceback
        with open("C:/Users/anaki/Desktop/Final_projects/new_website/stepsecure/model_server/full_crash.log", "w") as f:
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"CRASH: {str(e)}")


# ── Feature 3: Manual Test Mode ──────────────────────────────────────────────

@app.post("/api/model/test")
async def test_video(video: UploadFile = File(...)):
    """
    Upload any video. Returns a full per-person report:
    verdict, confidence, nearest gallery match, thumbnail.
    """
    data = await video.read()
    ext  = os.path.splitext(video.filename or "test.mp4")[1] or ".mp4"
    path = save_tempfile(data, suffix=ext)

    loop   = asyncio.get_event_loop()
    report = await loop.run_in_executor(None, run_test_pipeline, path)

    try: os.remove(path)
    except: pass

    return report


# ── Gallery CRUD ──────────────────────────────────────────────────────────────

@app.get("/api/model/gallery")
async def list_gallery():
    return gallery.list_all()


@app.delete("/api/model/gallery/{person_id}")
async def remove_from_gallery(person_id: str):
    gallery.remove(person_id)
    return {"ok": True}


@app.get("/api/model/gallery/{person_id}")
async def get_gallery_entry(person_id: str):
    entry = gallery.get(person_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Person not in gallery")
    return entry


# ── Feature 1: Stream Monitoring ─────────────────────────────────────────────

@app.post("/api/model/streams/start")
async def start_stream(
    background_tasks: BackgroundTasks,
    camera_id: str = Form(...),
    rtsp_url:  str = Form(...),
):
    """Start monitoring an RTSP camera. Runs as background asyncio task."""
    if camera_id in _stream_trackers:
        return {"ok": True, "message": "Already monitoring this camera"}

    tracker = StreamTracker(camera_id=camera_id, rtsp_url=rtsp_url)
    _stream_trackers[camera_id] = tracker
    background_tasks.add_task(tracker.run)

    return {"ok": True, "camera_id": camera_id, "message": "Stream monitor started"}


@app.post("/api/model/streams/stop")
async def stop_stream(camera_id: str = Form(...)):
    if camera_id not in _stream_trackers:
        raise HTTPException(status_code=404, detail="Stream not found")
    _stream_trackers[camera_id].stop()
    del _stream_trackers[camera_id]
    return {"ok": True}


@app.get("/api/model/streams")
async def list_streams():
    return {"active": list(_stream_trackers.keys())}


# ── Alerts & Unknowns ─────────────────────────────────────────────────────────

@app.get("/api/model/alerts")
async def get_alerts(limit: int = 20):
    return alert_manager.get_alerts(limit)


@app.get("/api/model/unknowns")
async def get_unknowns(limit: int = 50):
    return alert_manager.get_unknowns(limit)


# ── Feature 4: Manual Incremental Update ─────────────────────────────────────

@app.post("/api/model/update-embedding")
async def update_embedding(
    person_id: str       = Form(...),
    alpha:     float     = Form(0.20),
    video:     UploadFile = File(...),
):
    """
    Re-run embedding extraction on a new video and blend with existing:
    new_emb = (1-alpha)*old + alpha*new   [then L2-normalise]
    Also backs up gallery before modifying.
    """
    data = await video.read()
    ext  = os.path.splitext(video.filename or "update.mp4")[1] or ".mp4"
    path = save_tempfile(data, suffix=ext)

    from clipper import frames_from_video

    def _extract():
        frames = frames_from_video(path, max_frames=60, skip=3)
        embs   = []
        for frame in frames:
            dets = detector.detect(frame)
            if not dets:
                continue
            _, box, _ = max(dets, key=lambda d: d[2])
            crop = detector.crop_person(frame, box)
            if crop is not None:
                emb = embedder.embed_crop(crop)
                if emb is not None:
                    embs.append(emb)
        return average_embeddings(embs), embedding_quality(embs)

    loop = asyncio.get_event_loop()
    avg, qual = await loop.run_in_executor(None, _extract)

    try: os.remove(path)
    except: pass

    if avg is None:
        raise HTTPException(status_code=422, detail="No person detected in video")

    ok = gallery.incremental_update(person_id, avg, alpha=alpha)
    if not ok:
        raise HTTPException(status_code=404, detail="Person not in gallery")

    return {
        "ok":             True,
        "person_id":      person_id,
        "new_quality_estimate": round(qual * 100, 1),
        "message":        f"Embedding blended with alpha={alpha} (backed up)"
    }


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=False)
