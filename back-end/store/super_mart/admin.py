import os
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Employee, Attendance, Payroll, PerformanceReview, 
    Product, Order, OrderItem, ProductImage, Department, Advertisement
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
    extra = 1

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price_at_purchase') 
    can_delete = False

class AttendanceInline(admin.TabularInline):
    model = Attendance
    extra = 0
    readonly_fields = ('date', 'status')
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

# --- 4. Order & Transaction Management ---

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'total_price', 'status', 'created_at', 'get_receipt_button')
    list_editable = ('status',)
    list_filter = ('status', 'created_at')
    search_fields = ('id', 'user_id')
    ordering = ('-created_at',)
    inlines = [OrderItemInline]

    def get_receipt_button(self, obj):
        fastapi_url = f"{INVOICE_SERVICE_URL}/api/invoices/generate?order_id={obj.id}"
        return format_html(
            '<a class="button" href="{}" target="_blank" '
            'style="background: #2e7d32; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-weight: bold;">'
            'View Invoice</a>', fastapi_url
        )
    get_receipt_button.short_description = "Billing"

# --- 5. HRM & Employee Management ---

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'full_name', 'department', 'position', 'status_badge')
    list_filter = ('department', 'is_active', 'position')
    search_fields = ('first_name', 'last_name', 'employee_id')
    inlines = [AttendanceInline]

    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
    def status_badge(self, obj):
        color = "#28a745" if obj.is_active else "#dc3545"
        return format_html(
            '<b style="color: white; background: {}; padding: 2px 6px; border-radius: 10px; font-size: 10px;">{}</b>', 
            color, "ACTIVE" if obj.is_active else "INACTIVE"
        )

@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ('employee', 'pay_period', 'amount', 'is_paid', 'get_payslip')
    list_filter = ('is_paid', 'pay_period')
    
    def get_payslip(self, obj):
        fastapi_url = f"{INVOICE_SERVICE_URL}/api/invoices/generate?user_id={obj.employee.employee_id}"
        return format_html(
            '<a class="button" href="{}" target="_blank" '
            'style="background: #1565c0; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: bold;">'
            'Generate Slip</a>', fastapi_url
        )
    get_payslip.short_description = "Payroll Action"

# --- 6. Missing Registrations (Fixes 404) ---

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'alt_text', 'image_preview')
    search_fields = ('product__name',)

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 40px; height: 40px; border-radius: 4px;" />', obj.image.url)
        return "No Image"

@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = ('title', 'location', 'is_active', 'created_at')
    list_editable = ('is_active',)
    list_filter = ('location', 'is_active')

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'status')
    list_filter = ('status', 'date')

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'price_at_purchase')