
from django.urls import path
from .auth_views import login, logout, register, google_login

urlpatterns = [
    path("register/", register, name="api-register"),
    path("login/", login, name="api-login"),
    path("logout/", logout, name="api-logout"),
    path("google/", google_login, name="api-google-login"),
]
