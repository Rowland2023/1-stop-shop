from rest_framework import serializers
from .models import (
    Product, Order, OrderItem, 
    Employee, Attendance, Payroll, PerformanceReview, ProductImage
)

# --- 1. MARKETPLACE & INVENTORY SERIALIZERS ---

class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['url', 'alt_text']

    def get_url(self, obj):
        # CloudinaryField objects have a .url property
        if obj.image:
            return obj.image.url
        return None

class ProductSerializer(serializers.ModelSerializer):
    additional_images = ProductImageSerializer(many=True, read_only=True, source='images')
    image_display = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'category', 'image_display', 'additional_images']

    def get_image_display(self, obj):
        # 1. Priority: Cloudinary Upload
        # If main_image exists, it returns the full https://res.cloudinary.com/... URL
        if obj.main_image:
            return obj.main_image.url
        
        # 2. Fallback: Local static path
        if obj.image_path:
            # Clean path to avoid double slashes
            path = obj.image_path.lstrip('/')
            # Use the BACKEND domain to serve static fallbacks
            return f"https://back-end-wdk7.onrender.com/static/{path}"
            
        return None
    
class OrderItemSerializer(serializers.ModelSerializer):
    # This pulls the product name and its current image into the order item
    product_name = serializers.ReadOnlyField(source='product.name')
    product_image = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'quantity', 'price_at_purchase']

    def get_product_image(self, obj):
        if obj.product.main_image:
            return obj.product.main_image.url
        return None

class OrderSerializer(serializers.ModelSerializer):
    # This is critical for your tracking: ensures nested items show up
    items = OrderItemSerializer(many=True, read_only=True)
    # Using ChoiceField ensures the string representation matches what the frontend expects
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
    # Nested relations to see history in the employee profile
    payrolls = PayrollSerializer(many=True, read_only=True)
    attendance = AttendanceSerializer(many=True, read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 
            'email', 'department', 'position', 'salary', 
            'is_active', 'date_joined', 'payrolls', 'attendance'
        ]