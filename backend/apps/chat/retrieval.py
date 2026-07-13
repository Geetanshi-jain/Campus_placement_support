"""
Retrieval pipeline: embed a query, search FAISS, join metadata from Postgres.
"""
from __future__ import annotations

import numpy as np


def retrieve_chunks(
    query: str,
    top_k: int = 5,
    company_filter: str | None = None,
    batch_filter: str | None = None,
    verdict_filter: str | None = None,
) -> list[dict]:
    """
    Embed the query, search FAISS, join with Postgres metadata.
    Returns list of chunk dicts for prompt construction.
    """
    from apps.chat.embeddings import embed_single
    from apps.chat.faiss_manager import faiss_manager
    from apps.chat.models import ExperienceChunk

    query_vec = embed_single(query)

    # Optional metadata pre-filter: get allowed chunk_ids from Postgres
    qs = ExperienceChunk.objects.all()
    if company_filter:
        qs = qs.filter(company__icontains=company_filter)
    if batch_filter:
        qs = qs.filter(batch=batch_filter)
    if verdict_filter:
        qs = qs.filter(verdict=verdict_filter)

    # If we're restricting to a subset, get their faiss_ids (for exclusion logic)
    allowed_chunk_ids = None
    if company_filter or batch_filter or verdict_filter:
        allowed_chunk_ids = set(qs.values_list("pk", flat=True))

    results = faiss_manager.search(query_vec, top_k=top_k * 2)

    chunks_out = []
    for chunk_id, score in results:
        if allowed_chunk_ids is not None and chunk_id not in allowed_chunk_ids:
            continue
        try:
            chunk = ExperienceChunk.objects.select_related("experience").get(pk=chunk_id)
        except ExperienceChunk.DoesNotExist:
            continue
        chunks_out.append({
            "chunk_id": chunk.chunk_id,
            "submission_id": chunk.experience.submission_id,
            "company": chunk.company,
            "batch": chunk.batch,
            "verdict": chunk.verdict,
            "chunk_type": chunk.chunk_type,
            "chunk_text": chunk.chunk_text,
            "score": score,
            "author": chunk.experience.author,
        })
        if len(chunks_out) >= top_k:
            break

    return chunks_out

_csv_data_cache = None
_csv_embeddings_cache = None

def retrieve_chunks_from_csv(
    query: str,
    top_k: int = 5,
    company_filter: str | None = None,
    batch_filter: str | None = None,
    verdict_filter: str | None = None,
) -> list[dict]:
    """
    Retrieve chunks directly from the IIPS_Placement_RAG_Data.csv file.
    """
    import csv
    import os
    import numpy as np
    from django.conf import settings
    from apps.chat.embeddings import embed_single, embed_texts
    
    global _csv_data_cache, _csv_embeddings_cache
    
    csv_path = os.path.join(settings.BASE_DIR, "..", "data", "Deive_summary", "IIPS_Placement_RAG_Data.csv")
    csv_path = os.path.normpath(csv_path)
    
    if _csv_data_cache is None:
        try:
            with open(csv_path, "r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                _csv_data_cache = list(reader)
        except Exception as e:
            print(f"[CSV Load Error] {e}")
            return []
            
    # Filter rows
    filtered_rows = []
    for row in _csv_data_cache:
        # Check company filter
        if company_filter and company_filter.lower() not in row.get("company", "").lower():
            continue
        # Since CSV doesn't have explicit batch/verdict matching DB, we might try basic substring matching
        if batch_filter and batch_filter.lower() not in row.get("date_timeline", "").lower() and batch_filter.lower() not in row.get("chunk_text", "").lower():
            continue
        if verdict_filter and verdict_filter.lower() not in row.get("category", "").lower() and verdict_filter.lower() not in row.get("chunk_text", "").lower():
            continue
            
        filtered_rows.append(row)
        
    if not filtered_rows:
        return []

    # If we haven't embedded the whole CSV yet, do it once and cache
    if _csv_embeddings_cache is None:
        try:
            texts = [r.get("chunk_text", "") for r in _csv_data_cache]
            _csv_embeddings_cache = embed_texts(texts)
        except Exception as e:
            print(f"[CSV Embedding Error] {e}")
            return []
            
    # Map filtered rows to their precomputed embeddings
    # We find the index of the row in _csv_data_cache to get its embedding
    row_indices = [_csv_data_cache.index(r) for r in filtered_rows]
    filtered_embeddings = _csv_embeddings_cache[row_indices]
    
    query_vec = embed_single(query)
    
    # Cosine similarity
    # similarity = dot(A, B) / (norm(A) * norm(B))
    norms = np.linalg.norm(filtered_embeddings, axis=1) * np.linalg.norm(query_vec)
    # prevent division by zero
    norms[norms == 0] = 1e-10
    similarities = np.dot(filtered_embeddings, query_vec) / norms
    
    # Get top_k indices
    top_indices = np.argsort(similarities)[::-1][:top_k]
    
    chunks_out = []
    for idx in top_indices:
        row = filtered_rows[idx]
        score = float(similarities[idx])
        chunks_out.append({
            "chunk_id": row.get("seq_id", ""),
            "submission_id": "CSV-" + row.get("seq_id", ""),
            "company": row.get("company", ""),
            "batch": row.get("date_timeline", ""),
            "verdict": row.get("category", ""),
            "chunk_type": "CSV Data",
            "chunk_text": row.get("chunk_text", ""),
            "score": score,
            "author": row.get("source", "Admin"),
        })
        
    return chunks_out
