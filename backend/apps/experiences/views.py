from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Company, Experience
from .serializers import CompanySerializer, ExperienceListSerializer, ExperienceSerializer


def update_company_stats(company_name: str):
    """Recompute denormalized Company stats after any experience change."""
    from django.db.models import Sum
    qs = Experience.objects.filter(company__iexact=company_name)
    visits = qs.count()
    selected = qs.filter(verdict="selected").count()
    # Sum students_appeared if stored per-experience; fall back to visits count
    appeared_agg = qs.aggregate(total=Sum("students_appeared"))["total"]
    students_appeared = appeared_agg if appeared_agg else 0
    last_batch = qs.order_by("-created_at").values_list("batch", flat=True).first() or ""
    Company.objects.update_or_create(
        name__iexact=company_name,
        defaults={
            "name": company_name,
            "visits_count": visits,
            "selected_count": selected,
            "students_appeared": students_appeared,
            "last_visited_batch": last_batch,
        },
    )



class ExperienceViewSet(viewsets.ModelViewSet):
    queryset = Experience.objects.all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["company", "author", "overall_process_summary", "tips_advice"]
    ordering_fields = ["date_submitted", "company", "batch", "verdict"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == "list":
            return ExperienceListSerializer
        return ExperienceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        company = params.get("company")
        batch = params.get("batch")
        verdict = params.get("verdict")
        month = params.get("month")  # format: YYYY-MM
        role = params.get("role")

        if company:
            qs = qs.filter(company__icontains=company)
        if batch:
            qs = qs.filter(batch=batch)
        if verdict:
            qs = qs.filter(verdict=verdict)
        if month:
            try:
                year, m = month.split("-")
                qs = qs.filter(created_at__year=int(year), created_at__month=int(m))
            except ValueError:
                pass
        if role:
            qs = qs.filter(role_offered__icontains=role)
        return qs

    def perform_create(self, serializer):
        experience = serializer.save(
            created_by=self.request.user,
            source_type="student_submit",
        )
        update_company_stats(experience.company)
        # Trigger async ingestion (chunk + embed)
        try:
            from apps.chat.ingestion import ingest_experience
            ingest_experience(experience)
        except Exception as e:
            print(f"[Ingestion warning] {e}")

    def perform_update(self, serializer):
        experience = serializer.save()
        update_company_stats(experience.company)

    def perform_destroy(self, instance):
        company_name = instance.company
        instance.delete()
        update_company_stats(company_name)


class CompanyListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        companies = Company.objects.all()
        search = request.query_params.get("search", "")
        if search:
            companies = companies.filter(name__icontains=search)
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)
