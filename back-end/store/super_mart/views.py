from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Product, Order, OrderItem, Employee, Payroll, Profile
from .serializers import ProductSerializer, OrderItemSerializer, OrderSerializer 
from .tasks import trigger_invoice_generation 

# --- 1. AUTH: REGISTRATION & LOGIN ---

@api_view(['POST'])
@authentication_classes([]) 
@permission_classes([AllowAny])
def register_user(request):
    print("DEBUG: Full Request Data received:", request.data)
    
    first_name = request.data.get('first_name')
    phone = request.data.get('phone')
    password = request.data.get('password')
    
    try:
        # 1. Validation
        if not first_name or not phone or not password:
            return Response({
            "error": "Missing credentials",
            "received": {
                "first_name": first_name,
                "phone": phone,
                "password": password
            }
        }, status=status.HTTP_400_BAD_REQUEST)
        
        # 2. Check for existence (Using phone as the unique identifier)
        if Profile.objects.filter(phone_number=phone).exists():
            return Response({"error": "Phone number already registered"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 3. Create user 
        # We use the phone number as the username to keep auth simple
        user = User.objects.create_user(
            username=phone, 
            first_name=first_name,
            password=password
        )
        
        # 4. Create the linked Profile
        Profile.objects.create(
            user=user,
            phone_number=phone
        )
        
        return Response({
            "message": "User registered successfully",
            "user_id": user.id,
            "first_name": user.first_name
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@authentication_classes([]) 
@permission_classes([AllowAny])
def login_user(request):
    data = request.data
    phone = data.get('phone')
    password = data.get('password')
    
    # We use the phone number (which we set as the username) to authenticate
    user = authenticate(username=phone, password=password)
    
    if user is not None:
        return Response({
            "message": "Login successful",
            "user_id": user.id,
            "first_name": user.first_name,
            "phone": phone
        }, status=status.HTTP_200_OK)
    else:
        return Response({"error": "Invalid Phone or Password"}, status=status.HTTP_401_UNAUTHORIZED)


# --- 2. HRM: EMPLOYEE DATA API ---
@api_view(['GET'])
@authentication_classes([]) 
@permission_classes([AllowAny]) 
def employee_detail_api(request, employee_id):
    try:
        emp = Employee.objects.filter(employee_id=employee_id).first()
        if not emp and str(employee_id).isdigit():
            emp = Employee.objects.filter(employee_id=str(employee_id).lstrip('0')).first()
            
        if not emp:
            return Response({"error": f"Employee {employee_id} not found"}, status=404)
        
        payroll_entry = Payroll.objects.filter(employee=emp).last()
        salary_amount = str(payroll_entry.amount) if payroll_entry else str(emp.salary)
        
        return Response({
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "salary": salary_amount,
            "department": emp.department,
            "position": emp.position
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)

# --- 3. MARKETPLACE: CATALOG ---
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

# --- 4. MARKETPLACE: UNIFIED ORDER API ---
@api_view(['GET', 'POST'])
@authentication_classes([]) 
@permission_classes([AllowAny])
def order_list(request):
    if request.method == 'GET':
        user_id = request.query_params.get('userId')
        orders = Order.objects.all().order_by('-id')
        if user_id:
            orders = orders.filter(user_id=user_id)
            
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        data = request.data
        try:
            new_order = Order.objects.create(
                user_id=data.get('userId', 'guest_001'),
                total_price=data.get('total'),
                status='Pending' 
            )
            
            order_items_data = [] 
            for item in data.get('items', []):
                product = Product.objects.get(id=item['id'])
                OrderItem.objects.create(
                    order=new_order,
                    product=product,
                    quantity=item.get('quantity', 1),
                    price_at_purchase=product.price
                )
                order_items_data.append({
                    "name": product.name,
                    "price": float(product.price),
                    "quantity": item.get('quantity', 1)
                })

            invoice_payload = {
                "order_id": new_order.id,
                "total_amount": float(data.get('total')),
                "items": order_items_data,
                "user_id": data.get('userId')
            }
            trigger_invoice_generation.delay(invoice_payload)

            return Response({
                "status": "Accepted",
                "message": "Order placed!",
                "id": new_order.id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

# --- 5. MARKETPLACE: ORDER DETAIL ---
@api_view(['GET'])
@authentication_classes([]) 
@permission_classes([AllowAny])
def get_order_detail(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        items = OrderItem.objects.filter(order=order)
        items_list = [{"product_name": i.product.name, "quantity": i.quantity, "price": str(i.price_at_purchase)} for i in items]
        return Response({"id": order.id, "total": str(order.total_price), "user_id": order.user_id, "items": items_list, "status": getattr(order, 'status', 'Processing')})
    except Order.DoesNotExist:
        return Response({"error": "Order not found"}, status=404)