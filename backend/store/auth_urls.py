from django.urls import path
from .auth_views import login, logout, register

urlpatterns = [
    path("register/", register, name="api-register"),
    path("login/", login, name="api-login"),
    path("logout/", logout, name="api-logout"),
]
