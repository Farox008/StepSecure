"""
pipeline.py — Stateless processing pipelines.

Feature 2 — Registration pipeline:
  Given a list of video file paths, extracts person crops across all videos,
  embeds them, averages into a single gallery embedding, and returns the
  quality score.

Feature 3 — Test pipeline:
  Given a single video file path, runs the full detect → embed → gallery-search
  pipeline and returns a per-track report.
"""

import os
import uuid
import numpy as np
from typing import List

import cv2

from detector import detector
from embedder import embedder, average_embeddings, embedding_quality
from gallery import gallery
from clipper import frames_from_video, frame_to_b64_jpeg


# ── Feature 2 — Registration ─────────────────────────────────────────────────

def run_registration(video_paths: List[str], person_id: str, name: str) -> dict:
    """
    Process N videos, extract person crops, build one averaged embedding,
    enrol in FAISS gallery.

    Returns:
      {person_id, name, quality_score (0-100), frames_checked,
       embeddings_extracted, enrolled, message}
    """
    all_embeddings = []
    total_frames   = 0

    for vpath in video_paths:
        frames = frames_from_video(vpath, max_frames=120, skip=2)
        total_frames += len(frames)

        for frame in frames:
            detections = detector.detect(frame)
            if not detections:
                continue
            # use the highest-confidence detection per frame
            _, box, _ = max(detections, key=lambda d: d[2])
            crop = detector.crop_person(frame, box)
            if crop is None:
                continue
            emb = embedder.embed_crop(crop)
            if emb is not None:
                all_embeddings.append(emb)

    if not all_embeddings:
        return {
            "person_id":          person_id,
            "name":               name,
            "quality_score":      0,
            "frames_checked":     total_frames,
            "embeddings_extracted": 0,
            "enrolled":           False,
            "message":            "No person detected in any video. "
                                  "Ensure the face/body is clearly visible.",
        }

    avg_emb   = average_embeddings(all_embeddings)
    qual_raw  = embedding_quality(all_embeddings)
    qual_pct  = round(qual_raw * 100, 1)

    gallery.enroll(
        person_id    = person_id,
        name         = name,
        embedding    = avg_emb,
        quality_score= qual_raw,
        video_count  = len(video_paths),
    )

    return {
        "person_id":           person_id,
        "name":                name,
        "quality_score":       qual_pct,
        "frames_checked":      total_frames,
        "embeddings_extracted":len(all_embeddings),
        "enrolled":            True,
        "message":             _quality_message(qual_pct),
    }


def _quality_message(score: float) -> str:
    if score >= 80:
        return "Excellent enrollment — recognition accuracy will be very high."
    if score >= 60:
        return "Good enrollment. Consider adding more videos for best accuracy."
    if score >= 40:
        return "Moderate quality. More angle variety in videos will help."
    return "Low quality. Ensure good lighting and clear body visibility."


# ── Feature 3 — Test / Manual Mode ──────────────────────────────────────────

def run_test_pipeline(video_path: str) -> dict:
    """
    Run the full pipeline on a single test video.
    Returns a report: per-track verdict + confidence + nearest gallery match.
    """
    import time
    start = time.time()

    cap = cv2.VideoCapture(video_path)
    total_frames = 0

    # track_id → {crops, frames, confs}
    tracks: dict = {}

    while True:
        ok, frame = cap.read()
        if not ok:
            break
        total_frames += 1

        detections = detector.detect_and_track(frame)
        for tid, box, conf in detections:
            if tid not in tracks:
                tracks[tid] = {"crops": [], "frames": [], "confs": []}
            crop = detector.crop_person(frame, box)
            if crop is not None:
                tracks[tid]["crops"].append(crop)
                tracks[tid]["frames"].append(frame.copy())
            tracks[tid]["confs"].append(conf)

    cap.release()

    # Build report
    persons_detected = []

    for tid, data in tracks.items():
        crops = data["crops"]
        if not crops:
            continue

        embs = [embedder.embed_crop(c) for c in crops[:15]]
        avg  = average_embeddings(embs)

        verdict      = "UNKNOWN"
        confidence   = 0
        person_id    = None
        person_name  = None
        match_score  = 0.0

        if avg is not None:
            matches = gallery.search(avg, top_k=1)
            if matches:
                best = matches[0]
                match_score = best["score"]
                if best["known"]:
                    verdict      = "KNOWN"
                    confidence   = best["confidence"]
                    person_id    = best["person_id"]
                    person_name  = best["name"]
                else:
                    confidence   = int((1 - best["score"]) * 100)

        # Pick a representative frame thumbnail
        mid_frame = data["frames"][len(data["frames"]) // 2] if data["frames"] else None
        thumb_b64 = frame_to_b64_jpeg(mid_frame, quality=70) if mid_frame is not None else ""

        persons_detected.append({
            "track_id":   tid,
            "verdict":    verdict,
            "confidence": confidence,
            "person_id":  person_id,
            "name":       person_name,
            "match_score":round(match_score, 4),
            "frames":     len(data["crops"]),
            "thumbnail":  thumb_b64,
        })

    elapsed_ms = int((time.time() - start) * 1000)

    return {
        "persons_detected":  persons_detected,
        "total_frames":      total_frames,
        "total_tracks":      len(tracks),
        "processing_time_ms":elapsed_ms,
    }
