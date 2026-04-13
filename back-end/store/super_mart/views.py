from django.db import transaction
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Product, Order, OrderItem, Employee, Payroll, Advertisement
from .serializers import ProductSerializer, OrderSerializer, AdvertisementSerializer
from .tasks import trigger_invoice_generation

# --- 1. AUTHENTICATION & ROOT VIEWS ---

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        "message": "Welcome to the Market-Place Unified API",
        "status": "Running"
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    data = request.data
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return Response({"error": "Missing credentials"}, status=400)
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username exists"}, status=400)
    user = User.objects.create_user(username=username, password=password)
    return Response({"message": "User created", "user_id": user.id}, status=201)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        return Response({
            "message": "Login successful", 
            "username": user.username,
            "user_id": user.id
        })
    return Response({"error": "Invalid credentials"}, status=401)

# --- 2. MARKETPLACE: PRODUCT & AD VIEWSETS ---

class ProductViewSet(viewsets.ModelViewSet):
    """
    Handles retrieval and management of products.
    Uses prefetch_related to optimize loading of the image gallery.
    """
    queryset = Product.objects.all().prefetch_related('images')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

class AdvertisementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows advertisements to be viewed.
    Supports filtering by location (e.g., /api/ads/?location=header_main).
    """
    serializer_class = AdvertisementSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Advertisement.objects.filter(is_active=True)
        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(location=location)
        return queryset

# --- 3. HRM: EMPLOYEE DATA API ---

@api_view(['GET'])
@permission_classes([AllowAny]) 
def employee_detail_api(request, employee_id):
    try:
        emp = Employee.objects.select_related('department').filter(employee_id=employee_id).first()
        if not emp and str(employee_id).isdigit():
            # Fallback for IDs that might have leading zeros stripped
            emp = Employee.objects.select_related('department').filter(employee_id=str(employee_id).lstrip('0')).first()
        
        if not emp:
            return Response({"error": "Not found"}, status=404)
        
        payroll = Payroll.objects.filter(employee=emp).order_by('-pay_period').first()
        salary = str(payroll.amount) if payroll else str(getattr(emp, 'salary', 0))
        
        return Response({
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "salary": salary,
            "department": emp.department.name if emp.department else "General",
            "position": emp.position
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)

# --- 4. MARKETPLACE: ORDER API ---

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def order_list(request):
    """
    GET: List orders (optionally filtered by userId).
    POST: Create a new order with atomic transaction.
    """
    if request.method == 'GET':
        user_id = request.query_params.get('userId')
        orders = Order.objects.all().order_by('-created_at')
        if user_id: 
            orders = orders.filter(user_id=user_id)
        return Response(OrderSerializer(orders, many=True).data)

    if request.method == 'POST':
        data = request.data
        try:
            with transaction.atomic():
                new_order = Order.objects.create(
                    user_id=data.get('userId', 'guest_001'),
                    total_price=data.get('total'),
                    status='Pending' 
                )
                items_data = [] 
                for item in data.get('items', []):
                    product = Product.objects.get(id=item['id'])
                    OrderItem.objects.create(
                        order=new_order, 
                        product=product,
                        quantity=item.get('quantity', 1),
                        price_at_purchase=product.price
                    )
                    items_data.append({
                        "name": product.name, 
                        "price": float(product.price), 
                        "quantity": item.get('quantity', 1)
                    })

            # Background invoice generation via Celery
            trigger_invoice_generation.delay({
                "order_id": new_order.id,
                "total_amount": float(data.get('total')),
                "items": items_data,
                "user_id": data.get('userId')
            })
            return Response({"status": "Accepted", "id": new_order.id}, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_order_detail(request, order_id):
    """
    Fetches details for a specific order. 
    Matches the URL path: api/orders/<int:order_id>/
    """
    try:
        order = Order.objects.get(id=order_id)
        return Response(OrderSerializer(order).data)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)