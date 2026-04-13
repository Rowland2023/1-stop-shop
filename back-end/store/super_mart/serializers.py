from rest_framework import serializers
from .models import (
    Product, Order, OrderItem, 
    Employee, Attendance, Payroll, PerformanceReview, 
    ProductImage, Department, Advertisement
)

# --- 1. PROMOTIONS SERIALIZER ---

class AdvertisementSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Advertisement
        fields = ['id', 'image_url', 'link_url', 'location', 'is_active']

    def get_image_url(self, obj):
        if obj.image:
            url = obj.image.url
            if 'cloudinary.com' in url:
                # Increased height to 250 to ensure header ads are visible and high quality
                url = url.replace('/upload/', '/upload/h_250,c_limit/')
            return url
        return None

# --- 2. MARKETPLACE SERIALIZERS ---

class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['image_url', 'alt_text']

    def get_image_url(self, obj):
        if obj.image:
            url = obj.image.url
            if 'cloudinary.com' in url:
                url = url.replace('/upload/', '/upload/w_800,c_limit/')
            return url
        return None

class ProductSerializer(serializers.ModelSerializer):
    additional_images = ProductImageSerializer(many=True, read_only=True, source='images')
    image_display = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'category', 
            'image_display', 'additional_images', 'description'
        ]

    def get_image_display(self, obj):
        if obj.main_image:
            url = obj.main_image.url
            if 'cloudinary.com' in url:
                url = url.replace('/upload/', '/upload/w_1000,c_limit/')
            return url
        return None

# --- 3. ORDER & HRM SERIALIZERS ---

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price_at_purchase']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    class Meta:
        model = Order
        fields = ['id', 'user_id', 'created_at', 'total_price', 'status', 'items']

class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    class Meta:
        model = Employee
        fields = '__all__'