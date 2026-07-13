"""
FAISS Index Manager — singleton that loads the index once at Django startup.
Thread-safe writes using a threading.Lock.
"""
import json
import threading
from pathlib import Path

import numpy as np

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    print("[FAISS] faiss-cpu not installed. Vector search disabled.")


class FAISSManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def initialize(self, index_path: Path, id_map_path: Path, dimension: int):
        if self._initialized:
            return
        self.index_path = index_path
        self.id_map_path = id_map_path
        self.dimension = dimension
        self._write_lock = threading.Lock()

        if not FAISS_AVAILABLE:
            self.index = None
            self.id_map = {}  # faiss_id (int) → chunk_id (int)
            self._initialized = True
            return

        index_path.parent.mkdir(parents=True, exist_ok=True)

        if index_path.exists():
            self.index = faiss.read_index(str(index_path))
            self.id_map = self._load_id_map()
        else:
            self.index = faiss.IndexFlatIP(dimension)  # Inner product (cosine after normalise)
            self.id_map = {}
        self._initialized = True

    def _load_id_map(self) -> dict:
        if self.id_map_path.exists():
            with open(self.id_map_path) as f:
                raw = json.load(f)
            return {int(k): v for k, v in raw.items()}
        return {}

    def _save(self):
        if not FAISS_AVAILABLE or self.index is None:
            return
        faiss.write_index(self.index, str(self.index_path))
        with open(self.id_map_path, "w") as f:
            json.dump(self.id_map, f)

    def add(self, vector: np.ndarray, chunk_id: int) -> int:
        """Add a single embedding vector; returns FAISS internal id."""
        if not FAISS_AVAILABLE or self.index is None:
            return -1
        vector = vector.reshape(1, -1).astype("float32")
        faiss.normalize_L2(vector)
        with self._write_lock:
            faiss_id = self.index.ntotal
            self.index.add(vector)
            self.id_map[faiss_id] = chunk_id
            self._save()
        return faiss_id

    def search(self, query_vector: np.ndarray, top_k: int = 5, exclude_faiss_ids: set = None):
        """
        Returns list of (chunk_id, score) sorted by descending score.
        exclude_faiss_ids: set of faiss internal ids to skip (soft-delete support).
        """
        if not FAISS_AVAILABLE or self.index is None or self.index.ntotal == 0:
            return []
        query_vector = query_vector.reshape(1, -1).astype("float32")
        faiss.normalize_L2(query_vector)
        k = min(top_k * 3, self.index.ntotal)  # over-fetch to allow exclusions
        scores, faiss_ids = self.index.search(query_vector, k)
        results = []
        for score, fid in zip(scores[0], faiss_ids[0]):
            if fid == -1:
                continue
            if exclude_faiss_ids and fid in exclude_faiss_ids:
                continue
            chunk_id = self.id_map.get(fid)
            if chunk_id is not None:
                results.append((chunk_id, float(score)))
            if len(results) >= top_k:
                break
        return results

    def rebuild_from_vectors(self, vectors: np.ndarray, chunk_ids: list):
        """Full rebuild — called by build_index.py or after bulk delete."""
        if not FAISS_AVAILABLE:
            return
        with self._write_lock:
            self.index = faiss.IndexFlatIP(self.dimension)
            vectors = vectors.astype("float32")
            faiss.normalize_L2(vectors)
            self.index.add(vectors)
            self.id_map = {i: cid for i, cid in enumerate(chunk_ids)}
            self._save()


# Singleton instance
faiss_manager = FAISSManager()
