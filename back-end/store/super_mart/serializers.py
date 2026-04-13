from rest_framework import serializers
from .models import (
    Product, Order, OrderItem, 
    Employee, Attendance, Payroll, PerformanceReview, ProductImage, Department
)

# --- 1. MARKETPLACE & INVENTORY SERIALIZERS ---

class ProductImageSerializer(serializers.ModelSerializer):
    """
    Handles gallery images. DRF automatically handles absolute URLs 
    for ImageFields if the request context is provided.
    """
    class Meta:
        model = ProductImage
        fields = ['image', 'alt_text']

class ProductSerializer(serializers.ModelSerializer):
    # 'source=images' refers to the related_name on the ProductImage model
    additional_images = ProductImageSerializer(many=True, read_only=True, source='images')
    image_display = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'category', 'image_display', 'additional_images']

    def get_image_display(self, obj):
        """
        Force absolute URLs for both Cloudinary and local static paths.
        This prevents '502' or 'Broken Image' errors on the React Frontend.
        """
        request = self.context.get('request')
        
        # 1. Handle Cloudinary/Main Image Field
        if obj.main_image:
            image_url = obj.main_image.url
            # If it's already a full Cloudinary URL (https://res.cloudinary.com...)
            if image_url.startswith('http'):
                return image_url
            # If it's a relative path, use request context to make it absolute
            if request:
                return request.build_absolute_uri(image_url)
            # Hardcoded fallback for production if request context fails
            return f"https://back-end-wdk7.onrender.com{image_url}"

        # 2. Handle Manual Static Fallback (image_path string)
        if hasattr(obj, 'image_path') and obj.image_path:
            path = f"/static/{obj.image_path}"
            if request:
                return request.build_absolute_uri(path)
            return f"https://back-end-wdk7.onrender.com{path}"
            
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
    # This ensures the frontend sees "Engineering" instead of a PK ID
    department_name = serializers.ReadOnlyField(source='department.name')
    
    payrolls = PayrollSerializer(many=True, read_only=True)
    # Ensure related_name='attendances' is set in your Employee/Attendance models
    attendances = AttendanceSerializer(many=True, read_only=True, source='attendances')

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 
            'email', 'department', 'department_name', 'position', 'salary', 
            'is_active', 'date_joined', 'payrolls', 'attendances'
        ]