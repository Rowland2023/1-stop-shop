from django.db import transaction
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Product, Order, OrderItem, Employee, Payroll, Department
from .serializers import ProductSerializer, OrderSerializer
from .tasks import trigger_invoice_generation

# --- 1. AUTHENTICATION & ROOT VIEWS ---

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        "message": "Welcome to the Market-Place Unified API",
        "status": "Running"
    })

@api_view(['POST'])
@authentication_classes([])
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
    return Response({"message": "User created", "id": user.id}, status=201)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def login_user(request):
    """Satisfies api/login/ path"""
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        return Response({"message": "Login successful", "username": user.username})
    return Response({"error": "Invalid credentials"}, status=401)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Satisfies api/profile/ path if exists in urls.py"""
    return Response({
        "username": request.user.username,
        "email": request.user.email
    })

# --- 2. MARKETPLACE: PRODUCT VIEWSET ---

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    authentication_classes = []
    permission_classes = [AllowAny]

# --- 3. HRM: EMPLOYEE DATA API ---

@api_view(['GET'])
@authentication_classes([]) 
@permission_classes([AllowAny]) 
def employee_detail_api(request, employee_id):
    try:
        emp = Employee.objects.select_related('department').filter(employee_id=employee_id).first()
        if not emp and str(employee_id).isdigit():
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

@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def get_order_detail(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        return Response(OrderSerializer(order).data)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)

@api_view(['GET', 'POST'])
@authentication_classes([]) 
@permission_classes([AllowAny])
def order_list(request):
    if request.method == 'GET':
        user_id = request.query_params.get('userId')
        orders = Order.objects.all().order_by('-created_at')
        if user_id: orders = orders.filter(user_id=user_id)
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
                        order=new_order, product=product,
                        quantity=item.get('quantity', 1),
                        price_at_purchase=product.price
                    )
                    items_data.append({"name": product.name, "price": float(product.price), "quantity": item.get('quantity', 1)})

            trigger_invoice_generation.delay({
                "order_id": new_order.id,
                "total_amount": float(data.get('total')),
                "items": items_data,
                "user_id": data.get('userId')
            })
            return Response({"status": "Accepted", "id": new_order.id}, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)