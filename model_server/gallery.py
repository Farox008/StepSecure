"""
gallery.py — FAISS-backed person gallery with incremental learning.

Layout on disk (./gallery/):
  gallery.index   — FAISS IndexFlatIP (cosine after L2-norm)
  gallery.json    — list of {person_id, name, embedding, meta}
  backup_*/       — pre-update backups (auto-created before every blend)
"""

import os
import json
import shutil
import numpy as np
import faiss
from datetime import datetime
from typing import Optional

GALLERY_DIR = os.path.join(os.path.dirname(__file__), "gallery")
INDEX_PATH  = os.path.join(GALLERY_DIR, "gallery.index")
META_PATH   = os.path.join(GALLERY_DIR, "gallery.json")

DIM = 1280                   # must match embedder.DIM
MATCH_THRESHOLD = 0.72       # cosine score ≥ this → KNOWN


class Gallery:
    def __init__(self):
        os.makedirs(GALLERY_DIR, exist_ok=True)
        self._load()

    # ── persistence ───────────────────────────────────────────────────────────
    def _load(self):
        if os.path.exists(INDEX_PATH) and os.path.exists(META_PATH):
            self.index = faiss.read_index(INDEX_PATH)
            with open(META_PATH) as f:
                self._meta = json.load(f)
        else:
            self.index = faiss.IndexFlatIP(DIM)
            self._meta = []

    def _save(self, backup: bool = False):
        if backup and os.path.exists(INDEX_PATH):
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            bdir = os.path.join(GALLERY_DIR, f"backup_{ts}")
            os.makedirs(bdir, exist_ok=True)
            shutil.copy(INDEX_PATH, os.path.join(bdir, "gallery.index"))
            shutil.copy(META_PATH,  os.path.join(bdir, "gallery.json"))

        faiss.write_index(self.index, INDEX_PATH)
        with open(META_PATH, "w") as f:
            json.dump(self._meta, f, indent=2)

    def _rebuild_index(self):
        self.index = faiss.IndexFlatIP(DIM)
        for m in self._meta:
            emb = np.array(m["embedding"], dtype=np.float32)
            self.index.add(emb.reshape(1, -1))

    # ── public API ────────────────────────────────────────────────────────────
    def enroll(self, person_id: str, name: str, embedding: np.ndarray,
               quality_score: float = 0.0, video_count: int = 0) -> dict:
        """Add or overwrite a person in the gallery."""
        emb = _unit(np.array(embedding, dtype=np.float32))

        # Remove old entry if exists
        self._meta = [m for m in self._meta if m["person_id"] != person_id]
        self._rebuild_index()

        self.index.add(emb.reshape(1, -1))
        record = {
            "person_id":     person_id,
            "name":          name,
            "embedding":     emb.tolist(),
            "quality_score": round(quality_score * 100, 1),
            "video_count":   video_count,
            "enrolled_at":   datetime.now().isoformat(),
        }
        self._meta.append(record)
        self._save()
        return record

    def search(self, query: np.ndarray, top_k: int = 1) -> list:
        """Return top-k matches sorted by score descending."""
        if self.index.ntotal == 0:
            return []

        emb = _unit(np.array(query, dtype=np.float32))
        k   = min(top_k, self.index.ntotal)
        scores, idxs = self.index.search(emb.reshape(1, -1), k)

        results = []
        for score, idx in zip(scores[0], idxs[0]):
            if idx < 0:
                continue
            meta = {k: v for k, v in self._meta[idx].items() if k != "embedding"}
            meta["score"]      = float(score)
            meta["confidence"] = int(min(100, max(0, score * 100)))
            meta["known"]      = score >= MATCH_THRESHOLD
            results.append(meta)
        return results

    def incremental_update(self, person_id: str, new_embedding: np.ndarray,
                           alpha: float = 0.20) -> bool:
        """
        Feature 4 — blend: 80% old + 20% new.
        Backs up gallery before modifying; rebuilds index afterwards.
        Returns True on success.
        """
        for i, meta in enumerate(self._meta):
            if meta["person_id"] != person_id:
                continue

            old_emb = _unit(np.array(meta["embedding"], dtype=np.float32))
            new_emb = _unit(np.array(new_embedding,    dtype=np.float32))
            blended = _unit((1 - alpha) * old_emb + alpha * new_emb)

            self._meta[i]["embedding"] = blended.tolist()
            self._rebuild_index()
            self._save(backup=True)
            return True
        return False

    def remove(self, person_id: str):
        self._meta = [m for m in self._meta if m["person_id"] != person_id]
        self._rebuild_index()
        self._save()

    def list_all(self) -> list:
        return [{k: v for k, v in m.items() if k != "embedding"}
                for m in self._meta]

    def count(self) -> int:
        return len(self._meta)

    def get(self, person_id: str) -> Optional[dict]:
        for m in self._meta:
            if m["person_id"] == person_id:
                return {k: v for k, v in m.items() if k != "embedding"}
        return None


def _unit(v: np.ndarray) -> np.ndarray:
    return v / (np.linalg.norm(v) + 1e-9)


# Singleton
gallery = Gallery()
