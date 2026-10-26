
from django.urls import path
from . import views

urlpatterns = [
    path("products/", views.product_list, name="product-list"),
    path("products/admin/create/", views.admin_create_product, name="admin-create-product"),
    path("products/admin/<int:product_id>/", views.admin_manage_product, name="admin-manage-product"),
    path("me/", views.current_user, name="current-user"),
    path("bills/", views.create_bill, name="create-bill"),
    path("bills/history/", views.bill_history, name="bill-history"),
    path("bills/<int:bill_id>/", views.bill_detail, name="bill-detail"),
]
