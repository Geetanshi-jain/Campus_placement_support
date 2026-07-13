from django.contrib.auth.models import User
from django.db import models


class Experience(models.Model):
    VERDICT_CHOICES = [
        ("selected", "Selected"),
        ("rejected", "Rejected"),
        ("on_hold", "On Hold"),
        ("internship", "Internship Offer"),
    ]

    SOURCE_CHOICES = [
        ("student_submit", "Student Submission"),
        ("admin_upload", "Admin Upload (Excel)"),
    ]

    submission_id = models.AutoField(primary_key=True)
    company = models.CharField(max_length=255, db_index=True)
    author = models.CharField(max_length=255, blank=True, help_text="Student name (optional)")
    batch = models.CharField(max_length=20, db_index=True, help_text="e.g. 2025")
    date_submitted = models.DateField(auto_now_add=True)
    verdict = models.CharField(max_length=20, choices=VERDICT_CHOICES, default="rejected", db_index=True)

    overall_process_summary = models.TextField(blank=True)

    # Round 1
    round_1_name = models.CharField(max_length=100, blank=True)
    round_1_topics = models.TextField(blank=True)
    round_1_duration = models.CharField(max_length=50, blank=True)
    round_1_notes = models.TextField(blank=True)

    # Round 2
    round_2_name = models.CharField(max_length=100, blank=True)
    round_2_topics = models.TextField(blank=True)
    round_2_duration = models.CharField(max_length=50, blank=True)
    round_2_notes = models.TextField(blank=True)

    # Round 3
    round_3_name = models.CharField(max_length=100, blank=True)
    round_3_topics = models.TextField(blank=True)
    round_3_duration = models.CharField(max_length=50, blank=True)
    round_3_notes = models.TextField(blank=True)

    # Round 4
    round_4_name = models.CharField(max_length=100, blank=True)
    round_4_topics = models.TextField(blank=True)
    round_4_duration = models.CharField(max_length=50, blank=True)
    round_4_notes = models.TextField(blank=True)

    # Round 5
    round_5_name = models.CharField(max_length=100, blank=True)
    round_5_topics = models.TextField(blank=True)
    round_5_duration = models.CharField(max_length=50, blank=True)
    round_5_notes = models.TextField(blank=True)

    additional_rounds = models.TextField(blank=True)
    tips_advice = models.TextField(blank=True)
    ctc_offered = models.CharField(max_length=100, blank=True)
    role_offered = models.CharField(max_length=255, blank=True)

    source_type = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="student_submit")
    students_appeared = models.PositiveIntegerField(default=0, help_text="Total students who appeared in this company's drive")
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="experiences"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.company} | {self.batch} | {self.verdict}"


class Company(models.Model):
    """Denormalized stats per company — updated on each ingestion."""
    name = models.CharField(max_length=255, unique=True)
    visits_count = models.PositiveIntegerField(default=0)          # drive visits / experiences
    selected_count = models.PositiveIntegerField(default=0)
    students_appeared = models.PositiveIntegerField(default=0)     # students who sat for the drive
    last_visited_batch = models.CharField(max_length=20, blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Companies"

    def __str__(self):
        return self.name

    @property
    def selection_percentage(self):
        """Selection % based on students appeared (not just experience entries)."""
        denominator = self.students_appeared if self.students_appeared > 0 else self.visits_count
        if denominator == 0:
            return 0
        return round((self.selected_count / denominator) * 100, 1)
