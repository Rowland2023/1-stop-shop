from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Employee, Attendance, Payroll, PerformanceReview, 
    Product, Order, OrderItem, ProductImage, Department
)

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
    # Fixed: uses 'price_at_purchase' to match OrderItem model
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
    # CRITICAL FIX: Removed 'stock' to prevent admin.E108 
    # If your model uses 'quantity', change 'price' to 'price', 'quantity'
    list_display = ('thumbnail_tag', 'name', 'category', 'price')
    list_filter = ('category',)
    search_fields = ('name',)
    inlines = [ProductImageInline]

    def thumbnail_tag(self, obj):
        # Safely handle the main_image if it exists on the model
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
        # Points to your FastAPI invoicing service
        fastapi_url = f"http://localhost:8001/api/invoices/generate?order_id={obj.id}"
        return format_html(
            '<a class="button" href="{}" target="_blank" '
            'style="background: #2e7d32; color: white; padding: 4px 8px; border-radius: 4px;">'
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
        fastapi_url = f"http://localhost:8001/api/invoices/generate?user_id={obj.employee.employee_id}"
        return format_html('<a class="button" href="{}" target="_blank" style="font-size: 11px;">Generate Slip</a>', fastapi_url)

# Final Registrations
admin.site.register(Department)
admin.site.register(Attendance)
admin.site.register(OrderItem)