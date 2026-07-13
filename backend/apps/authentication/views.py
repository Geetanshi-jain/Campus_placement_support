"""
Authentication views — Function-Based Views (FBV)
Endpoints:
  POST /api/auth/student/register/
  POST /api/auth/student/login/
  POST /api/auth/admin/login/
  GET  /api/auth/me/
  POST /api/auth/logout/
"""
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Profile
from .serializers import LoginSerializer, StudentRegisterSerializer, UserSerializer


def get_tokens_for_user(user):
    """Generate JWT access + refresh token pair for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def student_register(request):
    """Register a new student account and return tokens."""
    serializer = StudentRegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response(
            {"user": UserSerializer(user).data, "tokens": tokens},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def student_login(request):
    """Authenticate a student user and return tokens."""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = authenticate(
        username=serializer.validated_data["username"],
        password=serializer.validated_data["password"],
    )
    if not user:
        return Response(
            {"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED
        )
    profile = getattr(user, "profile", None)
    if profile and profile.role != "student":
        return Response(
            {"detail": "Please use the admin login."}, status=status.HTTP_403_FORBIDDEN
        )
    tokens = get_tokens_for_user(user)
    return Response({"user": UserSerializer(user).data, "tokens": tokens})


@api_view(["POST"])
@permission_classes([AllowAny])
def admin_login(request):
    """Authenticate an admin user and return tokens."""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = authenticate(
        username=serializer.validated_data["username"],
        password=serializer.validated_data["password"],
    )
    if not user:
        return Response(
            {"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED
        )
    profile = getattr(user, "profile", None)
    if not profile or profile.role != "admin":
        return Response(
            {"detail": "Admin access only."}, status=status.HTTP_403_FORBIDDEN
        )
    tokens = get_tokens_for_user(user)
    return Response({"user": UserSerializer(user).data, "tokens": tokens})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """Return the currently authenticated user's profile data."""
    return Response(UserSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    """Blacklist the provided refresh token to log out the user."""
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
    except Exception:
        pass
    return Response({"detail": "Logged out."}, status=status.HTTP_205_RESET_CONTENT)
