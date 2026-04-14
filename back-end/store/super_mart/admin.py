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
admin.site.index_title = "Command Center (PostgreSQL Powered)"

# --- 2. Inlines ---
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 5  # Provides 5 empty slots for multiple image uploads
    fields = ('image', 'alt_text', 'image_preview')
    readonly_fields = ('image_preview',)

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 100px; height: auto; border-radius: 4px; border: 1px solid #ddd;" />', obj.image.url)
        return "Pending Upload"

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price_at_purchase')
    can_delete = False

# --- 3. Advertisement Management ---
@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    # Matches your model: title, image, is_active, created_at
    list_display = ('ad_preview', 'title', 'is_active', 'created_at')
    list_editable = ('is_active',)
    list_filter = ('is_active', 'created_at')
    
    def ad_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 150px; height: auto; border-radius: 4px;" />', obj.image.url)
        return "No Image"
    ad_preview.short_description = "Banner Preview"

# --- 4. Product Management (Matches models.image_display) ---
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('thumbnail_tag', 'name', 'category', 'price', 'created_at')
    list_filter = ('category', 'created_at')
    search_fields = ('name', 'description')
    inlines = [ProductImageInline]

    # Organize the "Add Product" form
    fieldsets = (
        ("General Information", {
            'fields': ('name', 'category', 'price', 'image_display')
        }),
        ("Product Details", {
            'fields': ('description',)
        }),
    )

    def thumbnail_tag(self, obj):
        # EXACT MATCH to your model's image_display field
        if obj.image_display:
            return format_html('<img src="{}" style="width: 50px; height: 50px; border-radius: 5px; object-fit: cover;" />', obj.image_display.url)
        return "No Image"
    thumbnail_tag.short_description = "General Image"

# --- 5. Orders & Transactions ---
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'total_price', 'status', 'created_at', 'invoice_slip')
    list_filter = ('status', 'created_at')
    readonly_fields = ('created_at',)
    inlines = [OrderItemInline]

    def invoice_slip(self, obj):
        url = f"{INVOICE_SERVICE_URL}/api/invoices/generate?order_id={obj.id}"
        return format_html(
            '<a class="button" href="{}" target="_blank" '
            'style="background:#1a73e8; color:white; padding:4px 8px; border-radius:4px; text-decoration:none; font-weight:bold;">'
            'Invoice Slip</a>', url
        )

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'product', 'quantity', 'price_at_purchase')
    list_filter = ('product',)

# --- 6. Payroll & HRM ---
@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ('employee', 'pay_period', 'amount', 'is_paid', 'pay_slip')
    list_filter = ('is_paid', 'pay_period')

    def pay_slip(self, obj):
        url = f"{INVOICE_SERVICE_URL}/api/invoices/generate?user_id={obj.employee.employee_id}"
        return format_html(
            '<a class="button" href="{}" target="_blank" '
            'style="background:#2e7d32; color:white; padding:4px 8px; border-radius:4px; text-decoration:none; font-weight:bold;">'
            'Pay Slip</a>', url
        )

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'first_name', 'last_name', 'department', 'is_active')
    list_filter = ('department', 'is_active')

# --- 7. Final Registrations ---
admin.site.register(Department)
admin.site.register(Attendance)
admin.site.register(PerformanceReview)