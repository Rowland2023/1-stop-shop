from rest_framework import serializers
from .models import (
    Product, Order, OrderItem, 
    Employee, Attendance, Payroll, PerformanceReview, ProductImage
)

# Helper function to ensure Cloudinary URLs use HTTPS
def secure_url(url):
    if url and url.startswith('http://'):
        return url.replace('http://', 'https://', 1)
    return url

# --- 1. MARKETPLACE & INVENTORY SERIALIZERS ---

class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['url', 'alt_text']

    def get_url(self, obj):
        if obj.image:
            return secure_url(obj.image.url)
        return None

class ProductSerializer(serializers.ModelSerializer):
    additional_images = ProductImageSerializer(many=True, read_only=True, source='images')
    image_display = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'category', 'image_display', 'additional_images']

    def get_image_display(self, obj):
        # 1. Priority: Cloudinary Upload
        if obj.main_image:
            return secure_url(obj.main_image.url)
        
        # 2. Fallback: Local static path (served from BACKEND)
        if obj.image_path:
            path = obj.image_path.lstrip('/')
            return f"https://back-end-wdk7.onrender.com/static/{path}"
            
        return None
    
class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_image = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'quantity', 'price_at_purchase']

    def get_product_image(self, obj):
        # Use secure_url and check main_image correctly
        if obj.product.main_image:
            return secure_url(obj.product.main_image.url)
        return None

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user_id', 'created_at', 'total_price', 'status', 'status_display', 'items']


# --- 2. HRM & EMPLOYEE SERIALIZERS ---

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'

class PayrollSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payroll
        fields = '__all__'

class PerformanceReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceReview
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    payrolls = PayrollSerializer(many=True, read_only=True)
    attendance = AttendanceSerializer(many=True, read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 
            'email', 'department', 'position', 'salary', 
            'is_active', 'date_joined', 'payrolls', 'attendance'
        ]