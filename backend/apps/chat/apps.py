from django.apps import AppConfig
from django.conf import settings


class ChatConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.chat"

    def ready(self):
        """Load FAISS index into memory once at Django startup."""
        try:
            from apps.chat.faiss_manager import faiss_manager
            faiss_manager.initialize(
                index_path=settings.FAISS_INDEX_PATH,
                id_map_path=settings.FAISS_ID_MAP_PATH,
                dimension=settings.EMBEDDING_DIMENSION,
            )
            print("[FAISS] Index loaded successfully.")
        except Exception as e:
            print(f"[FAISS] Failed to initialize: {e}")
