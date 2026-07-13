from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import student_register, student_login, admin_login, me, logout

urlpatterns = [
    path("student/register/", student_register, name="student-register"),
    path("student/login/",    student_login,    name="student-login"),
    path("admin/login/",      admin_login,      name="admin-login"),
    path("me/",               me,               name="me"),
    path("logout/",           logout,           name="logout"),
    path("token/refresh/",    TokenRefreshView.as_view(), name="token-refresh"),
]
