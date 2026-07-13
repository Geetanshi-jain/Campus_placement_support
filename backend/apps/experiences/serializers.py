from rest_framework import serializers
from .models import Company, Experience


class ExperienceSerializer(serializers.ModelSerializer):
    created_by_username = serializers.SerializerMethodField()

    class Meta:
        model = Experience
        fields = "__all__"
        read_only_fields = ["submission_id", "date_submitted", "created_by", "created_at", "updated_at"]

    def get_created_by_username(self, obj):
        if obj.created_by:
            return obj.created_by.username
        return None


class ExperienceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    class Meta:
        model = Experience
        fields = [
            "submission_id", "company", "author", "batch", "verdict",
            "date_submitted", "role_offered", "ctc_offered", "overall_process_summary",
        ]


class CompanySerializer(serializers.ModelSerializer):
    selection_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Company
        fields = ["id", "name", "visits_count", "selected_count", "selection_percentage", "last_visited_batch"]
