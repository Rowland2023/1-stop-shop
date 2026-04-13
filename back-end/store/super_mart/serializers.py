from rest_framework import serializers
from .models import (
    Product, Order, OrderItem, 
    Employee, Attendance, Payroll, PerformanceReview, ProductImage, Department
)

# --- 1. MARKETPLACE & INVENTORY SERIALIZERS ---

class ProductImageSerializer(serializers.ModelSerializer):
    """
    Handles gallery images. We force the absolute URL to ensure
    Cloudinary links are passed clearly to the React frontend.
    """
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['image_url', 'alt_text']

    def get_image_url(self, obj):
        if obj.image:
            # If Cloudinary already provided a full URL, use it
            if obj.image.url.startswith('http'):
                return obj.image.url
            
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            
            # Fallback to relative path for Nginx to proxy
            return f"/media/{obj.image.url.lstrip('/')}"
        return None

class ProductSerializer(serializers.ModelSerializer):
    # 'source=images' refers to the related_name on the ProductImage model
    additional_images = ProductImageSerializer(many=True, read_only=True, source='images')
    image_display = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'category', 'image_display', 'additional_images', 'description']

    def get_image_display(self, obj):
        """
        Critical for Nginx Reverse Proxy:
        Ensures images either point directly to Cloudinary or use a path
        that the Frontend (Nginx) can route to the Backend.
        """
        request = self.context.get('request')
        
        # 1. Handle Main Image Field (Cloudinary)
        if obj.main_image:
            image_url = obj.main_image.url
            if image_url.startswith('http'):
                return image_url
            
            if request:
                return request.build_absolute_uri(image_url)
            
            # Proxy fallback
            return f"/media/{image_url.lstrip('/')}"

        # 2. Handle Manual Static Fallback (if using local image_path strings)
        if hasattr(obj, 'image_path') and obj.image_path:
            path = f"/static/{obj.image_path.lstrip('/')}"
            if request:
                return request.build_absolute_uri(path)
            return path
            
        return None
    
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


# --- 2. HRM & EMPLOYEE SERIALIZERS ---

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'date', 'status', 'check_in', 'check_out']

class PayrollSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payroll
        fields = ['id', 'amount', 'pay_date', 'status', 'bonus', 'deductions']

class PerformanceReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerformanceReview
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    payrolls = PayrollSerializer(many=True, read_only=True)
    # Ensure related_name='attendances' is set in your model
    attendances = AttendanceSerializer(many=True, read_only=True, source='attendances')

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 
            'email', 'department', 'department_name', 'position', 'salary', 
            'is_active', 'date_joined', 'payrolls', 'attendances'
        ]