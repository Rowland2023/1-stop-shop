import os
from rest_framework import serializers
from .models import (
    Product, Order, OrderItem, 
    Employee, Attendance, Payroll, PerformanceReview, ProductImage
)

# --- HELPER UTILITY ---
def secure_url(image_field):
    """
    Ensures Cloudinary returns a full HTTPS URL. 
    Handles cases where the field might be a CloudinaryResource or a string.
    """
    if not image_field:
        return None
    
    # Get the URL from the CloudinaryField
    url = getattr(image_field, 'url', str(image_field))
    
    # If it's a relative path (common in some Cloudinary configs), build the full URL
    if url and not url.startswith('http'):
        cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME', 'your_cloud_name')
        url = f"https://res.cloudinary.com/{cloud_name}/{url}"
    
    # Force HTTPS
    if url.startswith('http://'):
        url = url.replace('http://', 'https://', 1)
        
    return url

# --- 1. MARKETPLACE & INVENTORY SERIALIZERS ---

class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['url', 'alt_text']

    def get_url(self, obj):
        return secure_url(obj.image)

class ProductSerializer(serializers.ModelSerializer):
    additional_images = ProductImageSerializer(many=True, read_only=True, source='images')
    image_display = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'category', 'image_display', 'additional_images']

    def get_image_display(self, obj):
        # 1. Primary: Check the 'main_image' field
        if obj.main_image:
            return secure_url(obj.main_image)
        
        # 2. Smart Fallback: Use the first image from the Gallery (additional_images)
        # This fixes the "null" issue when images are only in the inline gallery
        first_gallery_item = obj.images.first()
        if first_gallery_item and first_gallery_item.image:
            return secure_url(first_gallery_item.image)
        
        # 3. Last Resort: Local static fallback from Backend
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
        # Use the same logic for order history thumbnails
        if obj.product.main_image:
            return secure_url(obj.product.main_image)
        
        first_img = obj.product.images.first()
        if first_img:
            return secure_url(first_img.image)
            
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