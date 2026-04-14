import os
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Employee, Attendance, Payroll, PerformanceReview, 
    Product, Order, OrderItem, ProductImage, Department,
    Advertisement
)

# --- CONFIGURATION ---
INVOICE_SERVICE_URL = os.environ.get('INVOICE_SERVICE_URL', 'https://invoice-service-ttn6.onrender.com')

# --- 1. Global Site Branding ---
admin.site.site_header = "Lagos Tech Hub: Unified Marketplace & HRM"
admin.site.site_title = "Admin Portal"
admin.site.index_title = "Command Center"

# --- 2. Inlines ---
class ProductImageInline(admin.TabularInline):

    """
    This enables the 'Product Review Tag' / Multi-image logic.
    Users can upload several images that appear as a gallery on the frontend.
    """
    model = ProductImage
    extra = 3  
    fields = ('image', 'alt_text', 'image_preview')
    readonly_fields = ('image_preview',)

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 80px; height: auto; border-radius: 4px;" />', obj.image.url)
        return "Pending Upload"

# --- 3. Product & Inventory Management ---

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('thumbnail_tag', 'name', 'category', 'price')
    list_filter = ('category',)
    search_fields = ('name',)
    inlines = [ProductImageInline]

    fieldsets = (
        ("General Information", {'fields': ('name', 'category', 'price', 'image_display')}),
        ("Details", {'fields': ('description',)}),
    )

    def thumbnail_tag(self, obj):
        if hasattr(obj, 'image_display') and obj.image_display:
            return format_html('<img src="{}" style="width: 50px; height: 50px; object-fit: cover;" />', obj.image_display.url)
        return "No Image"

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image_preview', 'alt_text')
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 50px; height: auto;" />', obj.image.url)
        if hasattr(obj, 'main_image') and obj.main_image:
            return format_html('<img src="{}" style="width: 45px; height: 45px; border-radius: 5px; object-fit: cover;" />', obj.main_image.url)
        return "No Image"

# --- 5. HRM & Transactions (Maintaining your existing logic) ---
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'total_price', 'status')

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'first_name', 'last_name', 'department')

# Register remaining models ONLY ONCE
admin.site.register(Department)
admin.site.register(Attendance)
admin.site.register(Payroll)
admin.site.register(PerformanceReview)
admin.site.register(Advertisement)

