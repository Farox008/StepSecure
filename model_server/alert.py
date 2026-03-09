"""
alert.py — Unknown person alert tracker.

Tracks how many times an "UNKNOWN" person has been seen (via embedding
similarity across distinct clips). When the same unknown is seen ≥ N times,
fires an alert containing the clip path + snapshot.
"""

import numpy as np
from datetime import datetime
from typing import Optional
import uuid

UNKNOWN_ALERT_THRESHOLD = 3   # fire after 3 distinct unknown sightings
UNKNOWN_MATCH_THRESHOLD = 0.70  # consider two unknowns the "same" person


def _l2(v):
    return v / (np.linalg.norm(v) + 1e-9)


class AlertManager:
    def __init__(self):
        # list of {emb, count, snapshots, clips, first_seen, last_seen, alert_fired}
        self._unknowns: list = []
        self._alerts:   list = []   # fired alerts

    # ── record a new unknown sighting ─────────────────────────────────────────
    def record_unknown(self, embedding: np.ndarray, camera_id: str,
                       clip_path: Optional[str], snapshot_b64: Optional[str]):
        """
        Try to match `embedding` against known unknowns.
        If it matches an existing record → increment its counter.
        If counter reaches threshold → fire an alert.
        If no match → start a new unknown record.
        """
        emb = _l2(np.array(embedding, dtype=np.float32))
        matched = None
        best_score = -1

        for u in self._unknowns:
            score = float(np.dot(_l2(np.array(u["emb"])), emb))
            if score > UNKNOWN_MATCH_THRESHOLD and score > best_score:
                best_score = score
                matched = u

        now = datetime.now().isoformat()

        if matched:
            matched["count"] += 1
            matched["last_seen"] = now
            matched["camera_id"] = camera_id
            if clip_path:
                matched["clips"].append(clip_path)
            if snapshot_b64:
                matched["snapshots"].append(snapshot_b64)
            # blend embedding slightly
            matched["emb"] = _l2(0.85 * np.array(matched["emb"]) + 0.15 * emb).tolist()

            if matched["count"] >= UNKNOWN_ALERT_THRESHOLD and not matched.get("alert_fired"):
                matched["alert_fired"] = True
                self._fire_alert(matched)
        else:
            record = {
                "unknown_id":   str(uuid.uuid4()),
                "emb":          emb.tolist(),
                "count":        1,
                "camera_id":    camera_id,
                "clips":        [clip_path]    if clip_path     else [],
                "snapshots":    [snapshot_b64] if snapshot_b64 else [],
                "first_seen":   now,
                "last_seen":    now,
                "alert_fired":  False,
            }
            self._unknowns.append(record)

    def _fire_alert(self, unknown: dict):
        alert = {
            "alert_id":    str(uuid.uuid4()),
            "unknown_id":  unknown["unknown_id"],
            "camera_id":   unknown["camera_id"],
            "count":       unknown["count"],
            "first_seen":  unknown["first_seen"],
            "last_seen":   unknown["last_seen"],
            "clip_path":   unknown["clips"][-1] if unknown["clips"] else None,
            "snapshot_b64": unknown["snapshots"][-1] if unknown["snapshots"] else None,
            "fired_at":    datetime.now().isoformat(),
        }
        self._alerts.append(alert)
        print(f"[alert] 🚨 INTRUDER ALERT — seen {unknown['count']} times on {unknown['camera_id']}")

    # ── public reads ─────────────────────────────────────────────────────────
    def get_alerts(self, limit: int = 20) -> list:
        return sorted(self._alerts, key=lambda a: a["fired_at"], reverse=True)[:limit]

    def get_unknowns(self, limit: int = 50) -> list:
        return [
            {k: v for k, v in u.items() if k not in ("emb", "snapshots")}
            for u in sorted(self._unknowns, key=lambda x: x["last_seen"], reverse=True)[:limit]
        ]

    def clear_alerts(self):
        self._alerts.clear()


# Singleton
alert_manager = AlertManager()
