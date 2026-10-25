from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        token = request.COOKIES.get("access_token")

        if token:
            validated = self.get_validated_token(token)
            return self.get_user(validated), validated

        # Allows standard Bearer-token authentication too, if needed.
        return super().authenticate(request)
