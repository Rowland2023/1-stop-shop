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

# --- 2. Inlines (Product Reviews / Order Items) ---
class ProductImageInline(admin.TabularInline):
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

# --- 3. Advertisement Management (Header/Sidebar Ads) ---
@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    # 'location' helps you distinguish between 'header' and 'sidebar'
    list_display = ('ad_preview', 'title', 'location', 'is_active', 'created_at')
    list_editable = ('is_active', 'location')
    list_filter = ('location', 'is_active')
    
    def ad_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 120px; height: auto; border-radius: 4px; border: 1px solid #eee;" />', obj.image.url)
        return "No Image"
    ad_preview.short_description = "Live Preview"

# --- 4. Product & Review Optimization ---
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('thumbnail_tag', 'name', 'category', 'price')
    list_filter = ('category',)
    search_fields = ('name',)
    inlines = [ProductImageInline]

    fieldsets = (
        ("General Info", {'fields': ('name', 'category', 'price', 'main_image')}),
        ("Review Description", {'fields': ('description',)}),
    )

    def thumbnail_tag(self, obj):
        img = getattr(obj, 'main_image', None)
        if img:
            return format_html('<img src="{}" style="width: 50px; height: 50px; border-radius: 5px; object-fit: cover;" />', img.url)
        return "No Image"

# --- 5. Transactions & Payroll (With Slips) ---
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

admin.site.register(Department)
admin.site.register(Attendance)
admin.site.register(PerformanceReview)