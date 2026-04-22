import os
from rest_framework import serializers
from django.contrib.auth.models import User
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
    image_display = serializers.SerializerMethodField()
    additional_images = ProductImageSerializer(many=True, read_only=True, source='images')

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'category', 
            'description', 'image_display', 'additional_images'
        ]

    def get_image_display(self, obj):
        # 1. Highest Priority: The 'General Image' field (image_display)
        # DEBUG: See what is actually inside the model
        print(f"DEBUG: main_image={obj.main_image}, image_display={obj.image_display}")
        
        if obj.image_display:
            return secure_url(obj.image_display)
            
        # 2. Second Priority: The Cloudinary 'main_image'
        if obj.main_image:
            return secure_url(obj.main_image)
            
        # 3. Last Resort: First image from the 'additional_images' collection
        first_img = obj.images.first()
        if first_img:
            return secure_url(first_img.image)
            
        return "/static/placeholder.png"
    


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = '__all__'

# Add this class below OrderItemSerializer
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
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

class UserRegistrationSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='username') # Mapping phone to username
    
    class Meta:
        model = User
        fields = ['first_name', 'phone', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)