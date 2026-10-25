from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get("access_token")

        if raw_token:
            try:
                validated_token = self.get_validated_token(raw_token)
            except Exception as exc:
                raise AuthenticationFailed(
                    "Your session is invalid or expired. Please sign in again."
                ) from exc

            user = self.get_user(validated_token)
            return user, validated_token

        return super().authenticate(request)
