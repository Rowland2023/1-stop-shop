import os
from rest_framework import serializers
from .models import (
    Product, Order, OrderItem, 
    Employee, Attendance, Payroll, PerformanceReview, ProductImage
)

# --- HELPER UTILITY ---
def secure_url(image_field):
    """
    Normalize Cloudinary and local image paths into full HTTPS URLs.
    """
    if not image_field:
        return None

    # Try CloudinaryField .url property first
    url = getattr(image_field, 'url', str(image_field))

    # Fix relative Cloudinary paths (e.g. 'image/upload/...') 
    if url and not url.startswith('http'):
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME', 'dscxqsew5')
        url = f"https://res.cloudinary.com/{cloud_name}/{url}"

    # Force HTTPS
    if url and url.startswith('http://'):
        url = url.replace('http://', 'https://', 1)

    return url

# --- 1. MARKETPLACE & INVENTORY SERIALIZERS ---

class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['image', 'alt_text']

    def get_image(self, obj):
        return secure_url(obj.image)

# serializers.py
class ProductSerializer(serializers.ModelSerializer):
    # Change the field name to 'main_image_url' for clarity
    main_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'category', 'main_image_url', 'additional_images']

    def get_main_image_url(self, obj):
        # 1. Try the main_image field
        if obj.main_image:
            return secure_url(obj.main_image)
        # 2. Fallback: use the first image from the gallery
        first_img = obj.images.first()
        if first_img:
            return secure_url(first_img.image)
        return "/static/placeholder.png"
class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_image = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'quantity', 'price_at_purchase']

    def get_product_image(self, obj):
        if obj.product.main_image:
            return secure_url(obj.product.main_image)
        first_img = obj.product.images.first()
        if first_img:
            return secure_url(first_img.image)
        if obj.product.image:
            return secure_url(obj.product.image)
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
