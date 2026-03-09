"""
detector.py — YOLOv8 person detector with ByteTrack.

First call auto-downloads yolov8n.pt (~6 MB).
Returns bounding boxes, track IDs, and confidence per frame.
"""

import numpy as np
from typing import List, Tuple, Optional

# {track_id: (x1, y1, x2, y2), confidence}
Detection = Tuple[int, List[float], float]


class PersonDetector:
    """Wraps ultralytics YOLO — lazy-load on first use."""

    def __init__(self, model_size: str = "yolov8n.pt", conf: float = 0.40):
        self._model = None
        self._model_size = model_size
        self._conf = conf

    @property
    def model(self):
        if self._model is None:
            from ultralytics import YOLO
            print(f"[detector] Loading {self._model_size}…")
            self._model = YOLO(self._model_size)
            print("[detector] YOLOv8 ready")
        return self._model

    def detect(self, frame: np.ndarray) -> List[Detection]:
        """
        Detect persons in a single frame (no tracking).
        Returns list of (dummy_id, [x1,y1,x2,y2], conf).
        """
        results = self.model(frame, classes=[0], conf=self._conf, verbose=False)
        out = []
        for r in results:
            if r.boxes is None:
                continue
            for i, box in enumerate(r.boxes.xyxy.cpu().numpy()):
                conf = float(r.boxes.conf[i])
                out.append((i, box.tolist(), conf))
        return out

    def detect_and_track(self, frame: np.ndarray, persist: bool = True) -> List[Detection]:
        """
        Detect + track persons across frames (ByteTrack).
        Returns list of (track_id, [x1,y1,x2,y2], conf).
        """
        results = self.model.track(
            frame, classes=[0], conf=self._conf,
            persist=persist, tracker="bytetrack.yaml", verbose=False
        )
        out = []
        for r in results:
            if r.boxes is None or r.boxes.id is None:
                continue
            for i, (box, tid) in enumerate(
                zip(r.boxes.xyxy.cpu().numpy(), r.boxes.id.cpu().numpy())
            ):
                conf = float(r.boxes.conf[i])
                out.append((int(tid), box.tolist(), conf))
        return out

    def crop_person(self, frame: np.ndarray, box: List[float],
                    pad: float = 0.10) -> Optional[np.ndarray]:
        """
        Crop the person from the frame using the bounding box.
        Adds a percentage padding on all sides.
        """
        h, w = frame.shape[:2]
        x1, y1, x2, y2 = box
        pw = (x2 - x1) * pad
        ph = (y2 - y1) * pad
        x1 = max(0, int(x1 - pw))
        y1 = max(0, int(y1 - ph))
        x2 = min(w, int(x2 + pw))
        y2 = min(h, int(y2 + ph))
        crop = frame[y1:y2, x1:x2]
        return crop if crop.size > 0 else None


# Singleton
detector = PersonDetector()
