"""
embedder.py — Simple Person feature extractor
Uses OpenCV Color Histograms (no heavy AI models like timm/torch)
to produce 1280-D L2-normalised embeddings for person crops.
"""

import numpy as np
import cv2

DIM = 1280

class SimpleEmbedder:
    """Uses basic Color Histograms + Spatial resizing to get 1280 features"""
    
    def __init__(self):
        print(f"[embedder] Simple OpenCV Embedder ready — output dim: {DIM}")

    def embed_crop(self, bgr_crop: np.ndarray) -> np.ndarray:
        """BGR ndarray (from OpenCV) → 1280-D unit vector."""
        if bgr_crop is None or bgr_crop.size == 0:
            return None
            
        # 1. Resize crop to a fixed size (e.g. 64 x 128)
        resized = cv2.resize(bgr_crop, (64, 128))
        
        # 2. Extract Color Histogram in HSV space (robust to lighting)
        hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV)
        
        # Calculate 3D histogram: 16 Hue, 8 Saturation, 10 Value = 1280 bins exactly
        hist = cv2.calcHist([hsv], [0, 1, 2], None, [16, 8, 10], 
                            [0, 180, 0, 256, 0, 256])
        
        # Flatten to 1D array of 1280 elements
        emb = hist.flatten().astype(np.float32)
        
        return _l2(emb)

    def embed_crops_batch(self, bgr_crops: list) -> list:
        """Process a list of BGR crops."""
        return [self.embed_crop(c) for c in bgr_crops]


def _l2(v: np.ndarray) -> np.ndarray:
    n = np.linalg.norm(v)
    return v / (n + 1e-9)


def average_embeddings(embs: list) -> np.ndarray:
    """Average and re-normalise a list of 1-D numpy arrays."""
    valid = [e for e in embs if e is not None]
    if not valid:
        return None
    avg = np.mean(valid, axis=0)
    return _l2(avg)


def embedding_quality(embs: list) -> float:
    """
    Compute a quality score [0.0 – 1.0] based on:
      - How many embeddings were extracted
      - Their internal consistency
    """
    valid = [e for e in embs if e is not None]
    n = len(valid)
    if n == 0:
        return 0.0

    if n == 1:
        consistency = 0.6
    else:
        sims = []
        for i in range(n):
            for j in range(i + 1, n):
                sims.append(float(np.dot(valid[i], valid[j])))
        consistency = np.mean(sims)

    coverage = min(n / 15.0, 1.0)
    score = 0.5 * consistency + 0.5 * coverage
    return float(np.clip(score, 0.0, 1.0))


# Singleton
embedder = SimpleEmbedder()
