
from rest_framework import serializers
from .models import Product, Bill, BillItem


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id", "name", "category", "price",
            "stock", "emoji", "active",
        ]


class BillItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillItem
        fields = [
            "id", "product", "product_name",
            "price", "quantity", "line_total",
        ]


class BillSerializer(serializers.ModelSerializer):
    items = BillItemSerializer(many=True, read_only=True)

    class Meta:
        model = Bill
        fields = [
            "id", "subtotal", "gst",
            "total", "created_at", "items",
        ]
