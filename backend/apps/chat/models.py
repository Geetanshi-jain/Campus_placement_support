from django.db import models
from apps.experiences.models import Experience


class ExperienceChunk(models.Model):
    CHUNK_TYPE_CHOICES = [
        ("summary", "Overall Summary"),
        ("round_1", "Round 1"),
        ("round_2", "Round 2"),
        ("round_3", "Round 3"),
        ("round_4", "Round 4"),
        ("round_5", "Round 5"),
        ("tips", "Tips & Advice"),
    ]

    chunk_id = models.AutoField(primary_key=True)
    experience = models.ForeignKey(
        Experience, on_delete=models.CASCADE, related_name="chunks"
    )
    chunk_text = models.TextField()
    chunk_type = models.CharField(max_length=20, choices=CHUNK_TYPE_CHOICES)
    faiss_id = models.IntegerField(default=-1, help_text="FAISS internal integer id")

    # Denormalized for fast post-search filtering
    company = models.CharField(max_length=255, db_index=True)
    batch = models.CharField(max_length=20, db_index=True)
    verdict = models.CharField(max_length=20)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["chunk_id"]

    def __str__(self):
        return f"Chunk {self.chunk_id} — {self.company} [{self.chunk_type}]"
