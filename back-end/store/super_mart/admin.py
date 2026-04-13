import os
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Employee, Attendance, Payroll, PerformanceReview, 
    Product, Order, OrderItem, ProductImage, Department,
    Advertisement
)

# --- CONFIGURATION ---
# Points to your deployed invoice microservice
INVOICE_SERVICE_URL = os.environ.get('INVOICE_SERVICE_URL', 'https://invoice-service-ttn6.onrender.com')

# --- 1. Global Site Branding ---
admin.site.site_header = "Lagos Tech Hub: Unified Marketplace & HRM"
admin.site.site_title = "Admin Portal"
admin.site.index_title = "Command Center (PostgreSQL Powered)"

# --- 2. Inlines (Nested Forms) ---

class ProductImageInline(admin.TabularInline):
    """Allows adding multiple review/product images directly on the Product page"""
    model = ProductImage
    extra = 3  
    fields = ('image', 'alt_text')

class OrderItemInline(admin.TabularInline):
    """Shows all items purchased within a single order view"""
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price_at_purchase')

class AttendanceInline(admin.TabularInline):
    """Logs daily clock-ins for employees"""
    model = Attendance
    extra = 1
    readonly_fields = ('date',)

# --- 3. Advertisement Management ---

@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = ('preview_img', 'title', 'location', 'is_active')
    list_editable = ('is_active', 'location')
    list_filter = ('location', 'is_active')
    
    def preview_img(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 150px; height: auto; border-radius: 5px; border: 1px solid #eee;" />', obj.image.url)
        return "No Image"
    preview_img.short_description = "Ad Preview"

# --- 4. Product & Gallery Management ---

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('thumbnail_tag', 'name', 'category', 'price')
    list_filter = ('category',)
    search_fields = ('name', 'description')
    inlines = [ProductImageInline]

    def thumbnail_tag(self, obj):
        # Displays the main listing image in the admin table
        if hasattr(obj, 'image_display') and obj.image_display:
            return format_html('<img src="{}" style="width: 45px; height: 45px; border-radius: 5px; object-fit: cover;" />', obj.image_display.url)
        return "No Image"

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    """
    FIX FOR 404 ERROR: This explicitly registers the standalone 
    URL admin/super_mart/productimage/add/
    """
    list_display = ('id', 'product', 'image_preview', 'alt_text')
    list_filter = ('product',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 50px; height: auto; border-radius: 3px;" />', obj.image.url)
        return "No Image"

# --- 5. Orders & Transactions ---

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'total_price', 'status', 'created_at', 'get_receipt_button')
    list_filter = ('status', 'created_at')
    inlines = [OrderItemInline]

    def get_receipt_button(self, obj):
        # Links directly to your external invoice PDF service
        url = f"{INVOICE_SERVICE_URL}/api/invoices/generate?order_id={obj.id}"
        return format_html(
            '<a class="button" href="{}" target="_blank" style="background: #2e7d32; color: white; padding: 5px 10px; border-radius: 4px; text-decoration: none;">View Invoice</a>', 
            url
        )

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'price_at_purchase')

# --- 6. HRM & Employee Management ---

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'full_name', 'department', 'position', 'is_active')
    search_fields = ('first_name', 'last_name', 'employee_id')
    list_filter = ('department', 'is_active')
    inlines = [AttendanceInline]

    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'status')

@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ('employee', 'pay_period', 'amount', 'is_paid')
    list_editable = ('is_paid',)

@admin.register(PerformanceReview)
class PerformanceReviewAdmin(admin.ModelAdmin):
    list_display = ('employee', 'review_date', 'rating', 'reviewer')
    list_filter = ('rating',)