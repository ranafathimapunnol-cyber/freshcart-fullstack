
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Product, Bill, BillItem
from .serializers import ProductSerializer, BillSerializer


GST_RATE = Decimal("0.05")


def money(value):
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@api_view(["GET"])
@permission_classes([AllowAny])
def product_list(request):
    products = Product.objects.filter(active=True).order_by("name")

    search = request.query_params.get("search", "").strip()
    if search:
        products = products.filter(
            Q(name__icontains=search)
            | Q(category__icontains=search)
        )

    return Response(ProductSerializer(products, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({
        "id": request.user.id,
        "username": request.user.get_username(),
        "email": request.user.email,
        "is_staff": request.user.is_staff,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_bill(request):
    items = request.data.get("items")

    if not isinstance(items, list) or not items:
        return Response(
            {"error": "Add at least one product to the cart."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate and combine duplicate product IDs.
    quantities = {}

    try:
        for item in items:
            product_id = int(item["product_id"])
            quantity = int(item["quantity"])

            if product_id <= 0 or quantity <= 0:
                raise ValueError

            if quantity > 10000:
                raise ValueError

            quantities[product_id] = (
                quantities.get(product_id, 0) + quantity
            )
    except (KeyError, TypeError, ValueError):
        return Response(
            {"error": "Each item needs a valid product_id and positive quantity."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        with transaction.atomic():
            products = Product.objects.select_for_update().filter(
                id__in=quantities.keys(),
                active=True,
            )
            product_map = {p.id: p for p in products}

            if len(product_map) != len(quantities):
                return Response(
                    {"error": "One or more products do not exist or are unavailable."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            subtotal = Decimal("0.00")
            prepared_items = []

            for product_id, quantity in quantities.items():
                product = product_map[product_id]

                if product.stock < quantity:
                    return Response(
                        {"error": f"Insufficient stock for {product.name}."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                unit_price = money(product.price)
                line_total = money(unit_price * quantity)
                subtotal += line_total

                prepared_items.append({
                    "product": product,
                    "quantity": quantity,
                    "price": unit_price,
                    "line_total": line_total,
                })

            subtotal = money(subtotal)
            gst = money(subtotal * GST_RATE)
            total = money(subtotal + gst)

            bill = Bill.objects.create(
                user=request.user,
                subtotal=subtotal,
                gst=gst,
                total=total,
            )

            for item in prepared_items:
                product = item["product"]

                BillItem.objects.create(
                    bill=bill,
                    product=product,
                    product_name=product.name,
                    price=item["price"],
                    quantity=item["quantity"],
                    line_total=item["line_total"],
                )

                product.stock -= item["quantity"]
                product.save(update_fields=["stock"])

        return Response(
            BillSerializer(bill).data,
            status=status.HTTP_201_CREATED,
        )

    except Exception:
        # Unexpected errors are logged by Django; do not expose
        # database details to the client.
        raise


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def bill_history(request):
    bills = (
        Bill.objects.filter(user=request.user)
        .prefetch_related("items")
        .order_by("-created_at")
    )

    return Response(BillSerializer(bills, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def bill_detail(request, bill_id):
    bill = get_object_or_404(
        Bill.objects.prefetch_related("items"),
        id=bill_id,
        user=request.user,
    )

    return Response(BillSerializer(bill).data)
