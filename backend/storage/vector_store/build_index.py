"""
build_index.py — Rebuild FAISS index from scratch using all ExperienceChunks in Postgres.
Run: python vector_store/build_index.py

Use this after bulk deletes or if the index gets out of sync.
"""
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

import numpy as np
from apps.chat.models import ExperienceChunk
from apps.chat.embeddings import embed_texts
from apps.chat.faiss_manager import faiss_manager
from django.conf import settings


def build():
    faiss_manager.initialize(
        index_path=settings.FAISS_INDEX_PATH,
        id_map_path=settings.FAISS_ID_MAP_PATH,
        dimension=settings.EMBEDDING_DIMENSION,
    )

    chunks = list(ExperienceChunk.objects.all())
    if not chunks:
        print("No chunks found. Upload some experiences first.")
        return

    print(f"Embedding {len(chunks)} chunks...")
    texts = [c.chunk_text for c in chunks]
    chunk_ids = [c.chunk_id for c in chunks]

    # Batch embed to avoid memory issues
    batch_size = 64
    all_vectors = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        vecs = embed_texts(batch)
        all_vectors.append(vecs)
        print(f"  Embedded {min(i + batch_size, len(texts))}/{len(texts)}")

    vectors = np.vstack(all_vectors).astype("float32")
    faiss_manager.rebuild_from_vectors(vectors, chunk_ids)

    # Update faiss_id in DB
    for faiss_id, chunk_id in enumerate(chunk_ids):
        ExperienceChunk.objects.filter(chunk_id=chunk_id).update(faiss_id=faiss_id)

    print(f"✅ Index rebuilt with {len(chunks)} vectors → {settings.FAISS_INDEX_PATH}")


if __name__ == "__main__":
    build()
