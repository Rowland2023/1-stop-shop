import os
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Employee, Attendance, Payroll, 
    Product, Order, OrderItem, ProductImage, Department
)

# --- CONFIGURATION ---
INVOICE_SERVICE_URL = os.environ.get('INVOICE_SERVICE_URL', 'https://invoice-service-ttn6.onrender.com')

# --- 1. Global Site Branding ---
admin.site.site_header = "Lagos Tech Hub: Unified Marketplace & HRM"
admin.site.site_title = "Admin Portal"
admin.site.index_title = "Command Center"

# --- 2. Inlines ---

class ProductImageInline(admin.TabularInline):
    """Allows adding review images directly inside the Product page"""
    model = ProductImage
    extra = 1

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price_at_purchase') 
    can_delete = False

# --- 3. Product & Inventory Management ---

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('thumbnail_tag', 'name', 'category', 'price')
    list_filter = ('category',)
    search_fields = ('name',)
    inlines = [ProductImageInline]

    def thumbnail_tag(self, obj):
        if hasattr(obj, 'main_image') and obj.main_image:
            return format_html('<img src="{}" style="width: 45px; height: 45px; border-radius: 5px; object-fit: cover;" />', obj.main_image.url)
        return "No Image"
    thumbnail_tag.short_description = "Preview"

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    """Standalone page for Product Images (Fixes the 404 error)"""
    list_display = ('product', 'alt_text', 'image_preview')
    search_fields = ('product__name',)

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 40px; height: 40px; border-radius: 4px;" />', obj.image.url)
        return "No Image"

# --- 4. Order & Transaction Management ---

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'total_price', 'status', 'created_at', 'get_receipt_button')
    list_editable = ('status',)
    list_filter = ('status', 'created_at')
    search_fields = ('id', 'user_id')
    inlines = [OrderItemInline]

    def get_receipt_button(self, obj):
        fastapi_url = f"{INVOICE_SERVICE_URL}/api/invoices/generate?order_id={obj.id}"
        return format_html(
            '<a class="button" href="{}" target="_blank" '
            'style="background: #2e7d32; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-weight: bold;">'
            'View Invoice</a>', fastapi_url
        )

# --- 5. HRM & Employee Management ---

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'first_name', 'last_name', 'department', 'position')
    list_filter = ('department', 'is_active')
    search_fields = ('first_name', 'last_name', 'employee_id')

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'status')

@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ('employee', 'pay_period', 'amount', 'is_paid')

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity')