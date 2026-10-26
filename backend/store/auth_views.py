from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from django.conf import settings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
User = get_user_model()


def issue_cookies(response, user):
    refresh = RefreshToken.for_user(user)

    response.set_cookie(
        "access_token",
        str(refresh.access_token),
        max_age=15 * 60,
        httponly=True,
        secure=False,  # Set True when deployed with HTTPS.
        samesite="Lax",
        path="/",
    )
    response.set_cookie(
        "refresh_token",
        str(refresh),
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=False,  # Set True when deployed with HTTPS.
        samesite="Lax",
        path="/api/auth/",
    )
    return response


def public_user(user):
    return {
        "id": user.pk,
        "name": user.get_full_name() or user.get_username(),
        "email": user.email,
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    name = str(request.data.get("name", "")).strip()
    email = str(request.data.get("email", "")).strip().lower()
    password = request.data.get("password", "")

    if not name or not email or not password:
        return Response(
            {"error": "Name, email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {"error": "This email is already registered. Please sign in."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        validate_password(password)
    except ValidationError as exc:
        return Response({"error": " ".join(exc.messages)}, status=400)

    if User.USERNAME_FIELD == "email":
        user = User.objects.create_user(email=email, password=password)
    else:
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
        )

    if hasattr(user, "first_name"):
        user.first_name = name
        user.save(update_fields=["first_name"])

    return issue_cookies(Response(public_user(user), status=201), user)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    email = str(request.data.get("email", "")).strip().lower()
    password = request.data.get("password", "")

    if not email or not password:
        return Response({"error": "Email and password are required."}, status=400)

    if User.USERNAME_FIELD == "email":
        user = authenticate(request, email=email, password=password)
    else:
        user = authenticate(request, username=email, password=password)

    if user is None:
        return Response({"error": "Invalid email or password."}, status=400)

    if not user.is_active:
        return Response({"error": "This account is inactive."}, status=403)

    if getattr(user, "is_blocked", False):
        return Response({"error": "This account has been blocked."}, status=403)

    return issue_cookies(Response(public_user(user)), user)


@api_view(["POST"])
@permission_classes([AllowAny])
def logout(request):
    response = Response({"message": "Logged out."})
    response.delete_cookie("access_token", path="/", samesite="Lax")
    response.delete_cookie("refresh_token", path="/api/auth/", samesite="Lax")
    return response

@api_view(["POST"])
@permission_classes([AllowAny])
def google_login(request):
    credential = request.data.get("credential", "")

    if not credential:
        return Response(
            {"error": "Google credential is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not settings.GOOGLE_CLIENT_ID:
        return Response(
            {"error": "Google sign-in is not configured on the server."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        google_user = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        return Response(
            {"error": "Invalid Google credential. Please try again."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    email = str(google_user.get("email", "")).strip().lower()
    email_verified = google_user.get("email_verified", False)
    name = str(google_user.get("name", "")).strip()

    if not email or not email_verified:
        return Response(
            {"error": "Please use a Google account with a verified email."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.filter(email__iexact=email).first()

    if user is None:
        username_field = User.USERNAME_FIELD

        if username_field == "email":
            user = User.objects.create_user(
                email=email,
                password=None,
            )
        else:
            user = User.objects.create_user(
                username=email,
                email=email,
                password=None,
            )

    if hasattr(user, "is_active") and not user.is_active:
        return Response(
            {"error": "This account is inactive."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if getattr(user, "is_blocked", False):
        return Response(
            {"error": "This account has been blocked."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if hasattr(user, "first_name") and not user.first_name and name:
        user.first_name = name
        user.save(update_fields=["first_name"])

    return issue_cookies(Response(public_user(user)), user)
