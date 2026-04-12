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
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        "message": "Welcome to the Market-Place Unified API",
        "status": "Running",
        "version": "1.1.0"
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    data = request.data
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return Response({"error": "Missing credentials"}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create_user(username=username, password=password)
    return Response({"message": "User created", "id": user.id}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    
    if user:
        login(request, user)  # Establishes the session for the frontend
        return Response({
            "message": "Login successful", 
            "username": user.username,
            "id": user.id
        })
    return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# --- 2. MARKETPLACE: PRODUCT VIEWSET ---

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('id')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        """
        CRITICAL: Passes the request to the serializer so it can 
        generate absolute URLs for Cloudinary/Media images.
        """
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

# --- 3. HRM: EMPLOYEE DATA API ---

@api_view(['GET'])
@permission_classes([AllowAny]) 
def employee_detail_api(request, employee_id):
    try:
        # Optimized lookup with select_related for the department name
        emp = Employee.objects.select_related('department').filter(employee_id=employee_id).first()
        
        # Fallback for ID padding issues (common in Lagos ERP imports)
        if not emp and str(employee_id).isdigit():
            emp = Employee.objects.select_related('department').filter(employee_id=str(employee_id).lstrip('0')).first()
            
        if not emp:
            return Response({"error": "Employee not found"}, status=status.HTTP_404_NOT_FOUND)
        
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
        return Response({"error": f"Internal Server Error: {str(e)}"}, status=500)

# --- 4. MARKETPLACE: ORDER API ---

@api_view(['GET'])
@permission_classes([AllowAny])
def get_order_detail(request, order_id):
    try:
        # Use prefetch_related to load all items and their products in one go
        order = Order.objects.prefetch_related('items__product').get(id=order_id)
        return Response(OrderSerializer(order, context={'request': request}).data)
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def order_list(request):
    if request.method == 'GET':
        user_id = request.query_params.get('userId')
        # Optimized Query: prefetch_related prevents N+1 issues when listing items
        orders = Order.objects.prefetch_related('items__product').all().order_by('-created_at')
        if user_id: 
            orders = orders.filter(user_id=user_id)
        
        return Response(OrderSerializer(orders, many=True, context={'request': request}).data)

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
                    try:
                        product = Product.objects.get(id=item['id'])
                    except Product.DoesNotExist:
                        continue # Skip invalid products or raise error
                        
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

            # Fire off Celery task after successful DB commit
            trigger_invoice_generation.delay({
                "order_id": new_order.id,
                "total_amount": float(data.get('total')),
                "items": items_data,
                "user_id": data.get('userId')
            })
            
            return Response({"status": "Accepted", "id": new_order.id}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": f"Order processing failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)