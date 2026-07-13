from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/auth/", include("apps.authentication.urls")),
    path("api/", include("apps.experiences.urls")),
    path("api/admin-panel/", include("apps.admin_panel.urls")),
    path("api/chat/", include("apps.chat.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
