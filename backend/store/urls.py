
from django.urls import path
from . import views

urlpatterns = [
    path("products/", views.product_list, name="product-list"),
    path("me/", views.current_user, name="current-user"),
    path("bills/", views.create_bill, name="create-bill"),
    path("bills/history/", views.bill_history, name="bill-history"),
    path("bills/<int:bill_id>/", views.bill_detail, name="bill-detail"),
]
