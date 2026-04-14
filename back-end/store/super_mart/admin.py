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
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price_at_purchase')
    can_delete = False

# --- 3. Advertisement Management (FIXED: Removed 'location' to prevent crash) ---
@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    # We use 'title' and 'is_active' as they are standard fields
    list_display = ('ad_preview', 'title', 'is_active', 'created_at')
    list_editable = ('is_active',)
    list_filter = ('is_active', 'created_at')
    
    def ad_preview(self, obj):
        if hasattr(obj, 'image') and obj.image:
            return format_html('<img src="{}" style="width: 120px; height: auto; border-radius: 4px;" />', obj.image.url)
        return "No Image"
    ad_preview.short_description = "Preview"

# --- 4. Product & Review Optimization ---
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('thumbnail_tag', 'name', 'category', 'price')
    list_filter = ('category',)
    search_fields = ('name',)
    inlines = [ProductImageInline]

    def thumbnail_tag(self, obj):
        # Safely check for different image field names
        img = getattr(obj, 'main_image', getattr(obj, 'image_display', None))
        if img:
            return format_html('<img src="{}" style="width: 50px; height: 50px; border-radius: 5px; object-fit: cover;" />', img.url)
        return "No Image"

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'total_price', 'status', 'invoice_slip')
    inlines = [OrderItemInline]

    def invoice_slip(self, obj):
        url = f"{INVOICE_SERVICE_URL}/api/invoices/generate?order_id={obj.id}"
        return format_html('<a class="button" href="{}" target="_blank" style="background:#1a73e8;color:white;padding:4px 8px;">Invoice</a>', url)

@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ('employee', 'pay_period', 'amount', 'pay_slip')

    def pay_slip(self, obj):
        url = f"{INVOICE_SERVICE_URL}/api/invoices/generate?user_id={obj.employee.employee_id}"
        return format_html('<a class="button" href="{}" target="_blank" style="background:#2e7d32;color:white;padding:4px 8px;">Pay Slip</a>', url)

# --- 6. HRM & Shared Assets ---
@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'first_name', 'last_name', 'department')

# Final Registrations (Checked for duplicates)
admin.site.register(Department)
admin.site.register(Attendance)
