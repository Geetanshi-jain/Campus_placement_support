"""
Embedding service — supports sentence-transformers (local) or Voyage AI (API).
"""
from django.conf import settings
import numpy as np


_st_model = None


def _get_st_model():
    global _st_model
    if _st_model is None:
        from sentence_transformers import SentenceTransformer
        _st_model = SentenceTransformer(settings.EMBEDDING_MODEL)
    return _st_model


def embed_texts(texts: list[str]) -> np.ndarray:
    """
    Embed a list of strings. Returns numpy array of shape (N, D).
    """
    backend = getattr(settings, "EMBEDDING_BACKEND", "sentence_transformers")

    if backend == "voyage":
        import voyageai
        client = voyageai.Client(api_key=settings.VOYAGE_API_KEY)
        result = client.embed(texts, model=settings.VOYAGE_EMBEDDING_MODEL)
        return np.array(result.embeddings, dtype="float32")
    else:
        model = _get_st_model()
        return model.encode(texts, convert_to_numpy=True, show_progress_bar=False)


def embed_single(text: str) -> np.ndarray:
    """Embed a single string. Returns shape (D,)."""
    return embed_texts([text])[0]
