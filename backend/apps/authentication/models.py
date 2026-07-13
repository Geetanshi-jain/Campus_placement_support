from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    ROLE_CHOICES = [
        ("student", "Student"),
        ("admin", "Admin"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="student")
    batch = models.CharField(max_length=20, blank=True, help_text="e.g. 2025, 2024")

    def __str__(self):
        return f"{self.user.username} ({self.role})"
