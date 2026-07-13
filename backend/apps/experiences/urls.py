from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import CompanyListView, ExperienceViewSet

router = DefaultRouter()
router.register(r"experiences", ExperienceViewSet, basename="experience")

urlpatterns = [
    path("", include(router.urls)),
    path("companies/", CompanyListView.as_view(), name="companies"),
]
