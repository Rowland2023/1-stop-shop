import json
from .models import Product           # ADD THIS to define 'Product'
from .serializers import OrderSerializer, ProductSerializer# You likely need this too
from django.db import transaction
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework import viewsets # <--- ADD THIS
from django.contrib.auth.models import User
from super_mart.models import Profile
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from .models import Order, OrderItem, Product, Payroll, Employee  # Ensure Payroll is added here
# in views.py
import requests
import logging


@api_view(['GET'])
def api_root_view(request):
    return Response({"message": "Welcome to the API root"})



@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({"detail": "CSRF cookie set"})


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    data = request.data
    # Print the data to Render Logs so you can see what is REALLY arriving
    print(f"DEBUG: Received Data: {data}") 
    
    # Use .get() to prevent crashing if a field is missing
    phone = data.get('phone')
    password = data.get('password')
    first_name = data.get('first_name', 'User') # Default to 'User' if name is missing

    if not phone or not password:
        return Response({"error": "Phone and Password are required"}, status=400)

    # Now, explicitly use the phone as the username
    try:
        user = User.objects.create_user(
            username=phone,  # Use phone as username
            first_name=first_name,
            password=password
        )
        
        Profile.objects.create(
            user=user,
            phone_number=phone
        )
        return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
# ... (rest of your views remain unchanged)
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


logger = logging.getLogger(__name__)

# --- Infrastructure: Payment Logic ---
def verify_paystack_transaction(reference):
    """External service communication with robust error handling."""
    url = f"https://api.paystack.co/transaction/verify/{reference}"
    headers = {"Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}"}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Paystack verification failed: {e}")
        return None

# --- Unified Order API ---
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-id')
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data
        items_data = data.get('items', [])
    
        if not items_data:
            return Response({"error": "No items provided"}, status=400)

        try:
            order = Order.objects.create(
                user_id=data.get('userId', 'guest_001'),
                total_price=data.get('total'),
                status='Pending'
            )
        
            # Bulk create is faster and more efficient for high-concurrency
            order_items = [
                OrderItem(
                    order=order,
                    product_id=item['id'],
                    quantity=item.get('quantity', 1),
                    price_at_purchase=Product.objects.get(id=item['id']).price
                )   for item in items_data
            ]
            OrderItem.objects.bulk_create(order_items)
        
            return Response({"id": order.id, "status": "Created"}, status=status.HTTP_201_CREATED)
        except Product.DoesNotExist:
            return Response({"error": "One or more products not found"}, status=404)
        except Exception as e:
           logger.error(f"Order creation failed: {e}")
           return Response({"error": "Internal server error"}, status=500)

# --- The "Rock-Solid" Verification Endpoint ---
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_payment(request):
    reference = request.data.get('reference')
    order_id = request.data.get('order_id')

    if not reference or not order_id:
        return Response({"error": "Missing params"}, status=400)

    payment_data = verify_paystack_transaction(reference)
    
    if payment_data and payment_data.get('status') and payment_data['data']['status'] == 'success':
        with transaction.atomic():
            order = Order.objects.select_for_update().get(id=order_id)
            
            # Idempotency check: Don't process twice
            if order.status == 'Paid':
                return Response({"message": "Already processed"}, status=200)

            # Security check: Amount verification
            amount_paid = payment_data['data']['amount'] / 100
            if float(order.total_price) != float(amount_paid):
                logger.warning(f"Payment mismatch for Order {order_id}")
                return Response({"error": "Invalid amount"}, status=400)

            order.status = 'Paid'
            order.save()
            
            # Here: Integrate Ledger Entry (e.g., Ledger.objects.create(...))
            return Response({"message": "Payment verified and recorded."}, status=200)
    
    return Response({"error": "Verification failed"}, status=400)

from django.template.loader import render_to_string
from django.http import HttpResponse

def render_receipt_pdf(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    # Professional touch: Block unauthorized receipt access
    if order.status != 'Paid':
        return HttpResponse("Receipt not available: Payment pending.", status=403)
        
    context = {'order': order, 'items': order.items.all()}
    return render(request, 'super_mart/receipt.html', context)

# --- 6. HRM: PAYROLL PRINTING ---
def print_payroll(request, payroll_id):
    payroll = get_object_or_404(Payroll, id=payroll_id)
    return render(request, 'super_mart/payslip.html', {'payroll': payroll})