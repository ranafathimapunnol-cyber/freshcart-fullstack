
from django.contrib import admin
from django.urls import path, include, include

urlpatterns = [
    path("api/auth/", include("store.auth_urls")),
    path("admin/", admin.site.urls),
    path("api/", include("store.urls")),
]
