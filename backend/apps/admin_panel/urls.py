from django.urls import path
from .views import upload_sheet, stats, placement_summary

urlpatterns = [
    path("upload-sheet/",      upload_sheet,      name="upload-sheet"),
    path("stats/",             stats,             name="admin-stats"),
    path("placement-summary/", placement_summary, name="placement-summary"),
]
