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
        fields = ['id', 'image_url', 'link_url', 'location']

    def get_image_url(self, obj):
        if obj.image:
            image_url = obj.image.url
            # Scaling for header ads: height limit 100px to keep the logo area clean
            if 'cloudinary.com' in image_url:
                image_url = image_url.replace('/upload/', '/upload/h_100,c_limit/')
            return image_url
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
            # Cloudinary gallery scaling (800px width limit)
            if 'cloudinary.com' in url:
                url = url.replace('/upload/', '/upload/w_800,c_limit/')
            
            if url.startswith('http'):
                return url
            
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
            return f"/media/{url.lstrip('/')}"
        return None

class ProductSerializer(serializers.ModelSerializer):
    additional_images = ProductImageSerializer(many=True, read_only=True, source='images')
    image_display = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'category', 
            'image', 'image_display', 'additional_images', 'description'
        ]

    def get_image_display(self, obj):
        request = self.context.get('request')
        
        if obj.main_image:
            image_url = obj.main_image.url
            # Scaling for main product page display
            if 'cloudinary.com' in image_url:
                image_url = image_url.replace('/upload/', '/upload/w_1000,c_limit/')
            
            if image_url.startswith('http'):
                return image_url
            if request:
                return request.build_absolute_uri(image_url)
            return f"/media/{image_url.lstrip('/')}"

        if hasattr(obj, 'image_path') and obj.image_path:
            path = f"/static/{obj.image_path.lstrip('/')}"
            if request:
                return request.build_absolute_uri(path)
            return path
            
        return None

    def get_image(self, obj):
        return self.get_image_display(obj)

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

# --- 3. HRM SERIALIZERS ---

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'date', 'status', 'check_in', 'check_out']

class PayrollSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payroll
        fields = ['id', 'employee', 'pay_period', 'amount', 'is_paid']

class PerformanceReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceReview
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    payrolls = PayrollSerializer(many=True, read_only=True)
    attendances = AttendanceSerializer(many=True, read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 
            'email', 'department', 'department_name', 'position', 'salary', 
            'is_active', 'date_joined', 'payrolls', 'attendances'
        ]