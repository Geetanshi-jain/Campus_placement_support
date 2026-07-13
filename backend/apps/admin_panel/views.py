"""
Admin panel views — Function-Based Views (FBV)
Endpoints:
  POST /api/admin-panel/upload-sheet/      — parse Excel, bulk upsert Experiences
  GET  /api/admin-panel/stats/             — company-wise visits, selection %, monthly trend
  GET  /api/admin-panel/placement-summary/ — parse DAVV placement drives summary MD
"""
import io
import re
from pathlib import Path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth

from apps.experiences.models import Company, Experience
from apps.authentication.models import Profile


def is_admin(user):
    """Check whether a user has the admin role."""
    profile = getattr(user, "profile", None)
    return profile and profile.role == "admin"


EXCEL_COLUMN_MAP = {
    # Excel column name → model field name (case-insensitive matching done at parse time)
    "company": "company",
    "author": "author",
    "batch": "batch",
    "verdict": "verdict",
    "overall process summary": "overall_process_summary",
    "overall_process_summary": "overall_process_summary",
    "round 1 name": "round_1_name",
    "round_1_name": "round_1_name",
    "round 1 topics": "round_1_topics",
    "round_1_topics": "round_1_topics",
    "round 1 notes": "round_1_notes",
    "round_1_notes": "round_1_notes",
    "round 1 duration": "round_1_duration",
    "round 2 name": "round_2_name",
    "round_2_name": "round_2_name",
    "round 2 topics": "round_2_topics",
    "round_2_topics": "round_2_topics",
    "round 2 notes": "round_2_notes",
    "round_2_notes": "round_2_notes",
    "round 2 duration": "round_2_duration",
    "round 3 name": "round_3_name",
    "round_3_name": "round_3_name",
    "round 3 topics": "round_3_topics",
    "round_3_topics": "round_3_topics",
    "round 3 notes": "round_3_notes",
    "round_3_notes": "round_3_notes",
    "round 4 name": "round_4_name",
    "round_4_name": "round_4_name",
    "round 4 topics": "round_4_topics",
    "round_4_topics": "round_4_topics",
    "round 4 notes": "round_4_notes",
    "round_4_notes": "round_4_notes",
    "round 5 name": "round_5_name",
    "round_5_name": "round_5_name",
    "round 5 topics": "round_5_topics",
    "round_5_topics": "round_5_topics",
    "round 5 notes": "round_5_notes",
    "round_5_notes": "round_5_notes",
    "tips advice": "tips_advice",
    "tips_advice": "tips_advice",
    "tips & advice": "tips_advice",
    "ctc offered": "ctc_offered",
    "ctc_offered": "ctc_offered",
    "role offered": "role_offered",
    "role_offered": "role_offered",
    "additional rounds": "additional_rounds",
    "additional_rounds": "additional_rounds",
    "students appeared": "students_appeared",
    "students_appeared": "students_appeared",
    "total students appeared": "students_appeared",
}


def parse_excel(file_obj) -> list[dict]:
    """Parse an uploaded Excel file into a list of field dicts."""
    import pandas as pd
    df = pd.read_excel(file_obj)
    df.columns = [str(c).strip().lower() for c in df.columns]
    records = []
    for _, row in df.iterrows():
        record = {}
        for col, val in row.items():
            field = EXCEL_COLUMN_MAP.get(col)
            if field and val is not None and str(val).strip() and str(val).strip().lower() != "nan":
                record[field] = str(val).strip()
        if record.get("company"):
            records.append(record)
    return records


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_sheet(request):
    """
    Bulk upload an Excel sheet of placement experiences.
    Admin only. Each row is parsed and saved as an Experience record.
    """
    if not is_admin(request.user):
        return Response({"detail": "Admin access only."}, status=status.HTTP_403_FORBIDDEN)

    file = request.FILES.get("file")
    if not file:
        return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

    if not file.name.endswith((".xlsx", ".xls")):
        return Response({"error": "Only Excel files (.xlsx/.xls) are accepted."}, status=status.HTTP_400_BAD_REQUEST)

    # Save raw file for audit
    import os
    from django.conf import settings as django_settings
    upload_dir = django_settings.MEDIA_ROOT
    upload_dir.mkdir(parents=True, exist_ok=True)
    save_path = upload_dir / file.name
    with open(save_path, "wb+") as dest:
        for chunk in file.chunks():
            dest.write(chunk)

    try:
        records = parse_excel(save_path)
    except Exception as e:
        return Response({"error": f"Failed to parse Excel: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    created_count = 0
    errors = []
    from apps.chat.ingestion import ingest_experience

    for i, rec in enumerate(records):
        try:
            experience = Experience.objects.create(
                source_type="admin_upload",
                created_by=request.user,
                **rec,
            )
            # Trigger ingestion (chunk + embed)
            try:
                ingest_experience(experience)
            except Exception as e_ingest:
                print(f"[Ingestion row {i}] {e_ingest}")

            # Update company stats
            from apps.experiences.views import update_company_stats
            update_company_stats(experience.company)
            created_count += 1
        except Exception as e:
            errors.append({"row": i + 2, "error": str(e)})

    return Response({
        "created": created_count,
        "errors": errors,
        "total_rows": len(records),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stats(request):
    """
    Return admin dashboard statistics:
    company-wise visits, selection %, monthly trend, and totals.
    Admin only.
    """
    if not is_admin(request.user):
        return Response({"detail": "Admin access only."}, status=status.HTTP_403_FORBIDDEN)

    # Company-wise stats
    companies = Company.objects.all().order_by("-visits_count")[:20]
    company_stats = [
        {
            "name": c.name,
            "visits": c.visits_count,
            "selected": c.selected_count,
            "students_appeared": c.students_appeared,
            "selection_pct": c.selection_percentage,
            "last_batch": c.last_visited_batch,
        }
        for c in companies
    ]

    # Monthly trend
    monthly = (
        Experience.objects.annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(count=Count("submission_id"), selected=Count("submission_id", filter=Q(verdict="selected")))
        .order_by("month")
    )
    monthly_trend = [
        {
            "month": m["month"].strftime("%Y-%m") if m["month"] else None,
            "total": m["count"],
            "selected": m["selected"],
        }
        for m in monthly
    ]

    # Totals
    total_drive_visits = Experience.objects.count()
    total_selected = Experience.objects.filter(verdict="selected").count()
    total_companies = Company.objects.count()

    # Students appeared: sum from Company table
    from django.db.models import Sum as DSum
    appeared_agg = Company.objects.aggregate(total=DSum("students_appeared"))["total"] or 0
    total_students_appeared = appeared_agg if appeared_agg > 0 else total_drive_visits

    # Selection rate
    selection_rate = round((total_selected / total_students_appeared * 100), 1) if total_students_appeared > 0 else 0

    return Response({
        "totals": {
            "companies_visited": total_companies,
            "total_drive_visits": total_drive_visits,
            "students_appeared": total_students_appeared,
            "selections": total_selected,
            "selection_rate": selection_rate,
            # Legacy keys for backward compatibility
            "experiences": total_drive_visits,
            "selected": total_selected,
            "companies": total_companies,
        },
        "company_stats": company_stats,
        "monthly_trend": monthly_trend,
    })


# ── Placement summary MD parsing ─────────────────────────────────────
_SUMMARY_MD = Path(__file__).resolve().parents[3] / "data" / "Deive_summary" / "DAVV_Placement_Drives_2025-26_Summary.md"


def _parse_placement_summary():
    """
    Parse DAVV_Placement_Drives_2025-26_Summary.md and return a list of dicts:
      { serial, name, period, package, selects, status }
    """
    if not _SUMMARY_MD.exists():
        return []

    text = _SUMMARY_MD.read_text(encoding="utf-8")

    pattern = re.compile(
        r"^## (\d+)\.\s+(.+?)\s*\(([^)]+)\)",
        re.MULTILINE,
    )

    matches = list(pattern.finditer(text))
    companies = []

    for i, m in enumerate(matches):
        serial = int(m.group(1))
        name = m.group(2).strip()
        period = m.group(3).strip()

        block_start = m.end()
        block_end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[block_start:block_end]

        pkg_match = re.search(r"\*\*Package:\*\*\s*(.+)", block)
        package = pkg_match.group(1).strip() if pkg_match else "N/A"
        package = package.split("\n")[0].strip().rstrip("*").strip()

        sel_match = re.search(r"\*\*Final Selects.*?\*\*[:\s]*(.+?)(?:\n|$)", block)
        selects_raw = sel_match.group(1).strip() if sel_match else "N/A"

        selects_upper = selects_raw.strip().upper()
        if "pending" in selects_raw.lower() or "⏳" in selects_raw:
            status_val = "pending"
        elif selects_upper == "" or selects_upper.startswith("N/A"):
            status_val = "no_result"
        else:
            status_val = "announced"

        companies.append({
            "serial": serial,
            "name": name,
            "period": period,
            "package": package,
            "selects": selects_raw,
            "status": status_val,
        })

    return companies


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def placement_summary(request):
    """
    Return the full company list parsed from the DAVV placement drives summary MD.
    Admin only.
    """
    if not is_admin(request.user):
        return Response({"detail": "Admin access only."}, status=status.HTTP_403_FORBIDDEN)

    companies = _parse_placement_summary()
    return Response({
        "total": len(companies),
        "companies": companies,
    })
