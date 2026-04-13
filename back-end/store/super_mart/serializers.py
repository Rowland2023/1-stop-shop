from rest_framework import serializers
from .models import Product, ProductImage, Advertisement, Order, OrderItem

# --- 1. Advertisement Serializer ---
class AdvertisementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Advertisement
        fields = ['id', 'title', 'image', 'link_url', 'location', 'is_active']

# --- 2. Product Gallery Serializer ---
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text']

# --- 3. Main Product Serializer ---
class ProductSerializer(serializers.ModelSerializer):
    # Note: 'source=images' refers to the related_name on the ProductImage model
    additional_images = ProductImageSerializer(many=True, read_only=True, source='images') 

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'description', 
            'category', 'image_display', 'additional_images'
        ]

# --- 4. Order Item Serializer (for nested order details) ---
class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price_at_purchase']

# --- 5. Order Serializer (THE MISSING PIECE) ---
class OrderSerializer(serializers.ModelSerializer):
    # This allows the frontend to see the list of items inside each order
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user_id', 'total_price', 'status', 
            'created_at', 'items'
        ]