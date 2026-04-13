from rest_framework import serializers
from .models import Product, ProductImage, Advertisement

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text']

class ProductSerializer(serializers.ModelSerializer):
    # This 'source' must match the related_name in your ProductImage model
    additional_images = ProductImageSerializer(many=True, read_only=True, source='images') 

    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'description', 'category', 'image_display', 'additional_images']