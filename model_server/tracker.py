"""
tracker.py — Per-camera RTSP frame-buffer tracker (Feature 1).

Reads an RTSP stream via OpenCV, runs YOLOv8 detection+tracking,
buffers frames per track_id. When a track has ≥ MIN_FRAMES frames:
  1. Extracts embeddings for the track's crops
  2. Compares against FAISS gallery
  3. If KNOWN + confidence ≥ 0.75 → trigger incremental update
  4. If UNKNOWN → record sighting; if ≥ 3 times → fire alert

Designed to run as an asyncio background task.
"""

import asyncio
import cv2
import numpy as np
import time
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

from detector import detector
from embedder import embedder, average_embeddings
from gallery import gallery
from clipper import save_clip, frame_to_b64_jpeg
from alert import alert_manager

MIN_FRAMES   = 30    # min frames before analysing a track
MAX_BUF      = 90    # discard oldest frames beyond this
CONF_INCR    = 0.75  # incremental learning threshold
FPS_LIMIT    = 10    # analyse at most N frames/sec (reduce GPU load)

_executor = ThreadPoolExecutor(max_workers=2)


class StreamTracker:
    """
    Opens one RTSP stream and monitors it continuously.
    Call `.stop()` to shut it down.
    """

    def __init__(self, camera_id: str, rtsp_url: str):
        self.camera_id = camera_id
        self.rtsp_url  = rtsp_url
        self._running  = False

        # per track_id: {frames: [], crops: [], analysed: bool}
        self._tracks: dict = defaultdict(lambda: {"frames": [], "crops": [], "analysed": False})

    def stop(self):
        self._running = False

    async def run(self):
        """Main loop — runs in an asyncio background task."""
        self._running = True
        loop = asyncio.get_event_loop()
        print(f"[tracker:{self.camera_id}] Starting stream monitor on {self.rtsp_url}")

        while self._running:
            cap = cv2.VideoCapture(self.rtsp_url)
            if not cap.isOpened():
                print(f"[tracker:{self.camera_id}] Cannot open stream — retrying in 5s")
                await asyncio.sleep(5)
                continue

            last_frame_time = 0.0

            while self._running:
                ok, frame = cap.read()
                if not ok:
                    print(f"[tracker:{self.camera_id}] Stream lost — reconnecting in 3s")
                    await asyncio.sleep(3)
                    break

                # Rate-limit ML inference
                now = time.time()
                if now - last_frame_time < 1.0 / FPS_LIMIT:
                    await asyncio.sleep(0.02)
                    continue
                last_frame_time = now

                # Run detection + tracking in thread pool
                detections = await loop.run_in_executor(
                    _executor, detector.detect_and_track, frame.copy()
                )

                active_ids = set()
                for track_id, box, conf in detections:
                    active_ids.add(track_id)
                    crop = detector.crop_person(frame, box)
                    buf  = self._tracks[track_id]

                    # Don't re-analyse a track that's already been processed
                    if buf["analysed"]:
                        continue

                    buf["frames"].append(frame.copy())
                    if crop is not None:
                        buf["crops"].append(crop)

                    # Trim buffer
                    if len(buf["frames"]) > MAX_BUF:
                        buf["frames"].pop(0)
                        buf["crops"].pop(0)

                    # Enough frames → analyse
                    if len(buf["crops"]) >= MIN_FRAMES:
                        await loop.run_in_executor(
                            _executor,
                            self._analyse_track,
                            track_id, list(buf["frames"]), list(buf["crops"])
                        )
                        buf["analysed"] = True

                # Clean up disappeared tracks
                stale = [tid for tid in list(self._tracks) if tid not in active_ids]
                for tid in stale:
                    del self._tracks[tid]

                # Yield to event loop
                await asyncio.sleep(0)

            cap.release()

        print(f"[tracker:{self.camera_id}] Stopped")

    def _analyse_track(self, track_id: int, frames: list, crops: list):
        """CPU-bound task: embed crops → gallery lookup → alert/update."""
        embs = [embedder.embed_crop(c) for c in crops[:20]]  # use at most 20 crops
        avg  = average_embeddings(embs)
        if avg is None:
            return

        matches = gallery.search(avg, top_k=1)

        if matches and matches[0]["known"]:
            person = matches[0]
            conf   = person["confidence"] / 100.0

            print(f"[tracker:{self.camera_id}] Track {track_id} → KNOWN: "
                  f"{person['name']} ({person['confidence']}%)")

            # Feature 4: incremental learning
            if conf >= CONF_INCR:
                gallery.incremental_update(person["person_id"], avg, alpha=0.20)
                print(f"[tracker:{self.camera_id}] Incremental update for {person['name']}")
        else:
            print(f"[tracker:{self.camera_id}] Track {track_id} → UNKNOWN")
            clip_path   = save_clip(frames[:30], fps=10, prefix=f"{self.camera_id}_unknown")
            snapshot_b64 = frame_to_b64_jpeg(frames[len(frames) // 2])
            alert_manager.record_unknown(avg, self.camera_id, clip_path, snapshot_b64)
