"""
Ingestion pipeline: splits an Experience into chunks, embeds them,
and stores in ExperienceChunk + FAISS index.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from apps.experiences.models import Experience


def chunk_experience(experience: "Experience") -> list[dict]:
    """Split an Experience into semantic chunks."""
    chunks = []
    
    # Build a richer context prefix for every chunk
    prefix_parts = [
        f"Company: {experience.company}",
        f"Batch: {experience.batch}",
        f"Verdict: {experience.verdict}"
    ]
    if getattr(experience, "role_offered", "").strip():
        prefix_parts.append(f"Role: {experience.role_offered}")
    if getattr(experience, "ctc_offered", "").strip():
        prefix_parts.append(f"CTC: {experience.ctc_offered}")
    if getattr(experience, "author", "").strip():
        prefix_parts.append(f"Author: {experience.author}")
        
    prefix = " | ".join(prefix_parts)

    if experience.overall_process_summary.strip():
        chunks.append({
            "chunk_text": f"{prefix}\n\nOverall Summary:\n{experience.overall_process_summary}",
            "chunk_type": "summary",
        })

    for i in range(1, 6):
        name = getattr(experience, f"round_{i}_name", "").strip()
        topics = getattr(experience, f"round_{i}_topics", "").strip()
        notes = getattr(experience, f"round_{i}_notes", "").strip()
        if name or topics or notes:
            text = f"{prefix}\nRound {i}: {name}\n"
            if topics:
                text += f"Topics: {topics}\n"
            if notes:
                text += f"Notes: {notes}\n"
            chunks.append({"chunk_text": text.strip(), "chunk_type": f"round_{i}"})

    if experience.tips_advice.strip():
        chunks.append({
            "chunk_text": f"{prefix}\nTips & Advice:\n{experience.tips_advice}",
            "chunk_type": "tips",
        })

    return chunks


def ingest_experience(experience: "Experience"):
    """
    Main entry point — called after an experience is created or updated.
    Deletes old chunks, re-chunks, embeds, and stores.
    """
    from apps.chat.models import ExperienceChunk
    from apps.chat.embeddings import embed_texts
    from apps.chat.faiss_manager import faiss_manager

    # Remove old chunks for this experience (mark as deleted in Postgres)
    ExperienceChunk.objects.filter(experience=experience).delete()

    raw_chunks = chunk_experience(experience)
    if not raw_chunks:
        return

    texts = [c["chunk_text"] for c in raw_chunks]
    vectors = embed_texts(texts)

    for i, (chunk_data, vector) in enumerate(zip(raw_chunks, vectors)):
        # Save to Postgres first to get chunk_id
        chunk = ExperienceChunk.objects.create(
            experience=experience,
            chunk_text=chunk_data["chunk_text"],
            chunk_type=chunk_data["chunk_type"],
            company=experience.company,
            batch=experience.batch,
            verdict=experience.verdict,
            faiss_id=-1,  # placeholder until we add to index
        )
        # Add to FAISS; get back the internal id
        import numpy as np
        faiss_id = faiss_manager.add(np.array(vector, dtype="float32"), chunk.pk)
        chunk.faiss_id = faiss_id
        chunk.save(update_fields=["faiss_id"])
