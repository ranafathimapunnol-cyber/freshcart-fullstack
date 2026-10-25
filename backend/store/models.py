
from django.conf import settings
from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=120, unique=True)
    category = models.CharField(max_length=80, default="Grocery")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    emoji = models.CharField(max_length=10, default="🛒")
    active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Bill(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="bills",
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    gst = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Bill #{self.pk}"


class BillItem(models.Model):
    bill = models.ForeignKey(
        Bill, on_delete=models.CASCADE, related_name="items"
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=120)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=12, decimal_places=2)
