
from django.contrib import admin
from .models import Product, Bill, BillItem


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "category",
        "price",
        "stock",
        "active",
    )
    list_filter = ("active", "category")
    search_fields = ("name", "category")
    list_editable = ("price", "stock", "active")
    fields = (
        "name",
        "category",
        "price",
        "stock",
        "emoji",
        "image",
        "active",
    )


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "subtotal", "gst", "total", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__username", "user__email")


@admin.register(BillItem)
class BillItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "bill",
        "product_name",
        "quantity",
        "price",
        "line_total",
    )
