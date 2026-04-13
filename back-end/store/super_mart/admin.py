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

# --- 2. Inlines (The "Multi-Form" logic) ---

class ProductImageInline(admin.TabularInline):
    """This allows you to add many images at once on the Product page"""
    model = ProductImage
    extra = 3  # Shows 3 empty rows by default
    fields = ('image', 'alt_text')

class AttendanceInline(admin.TabularInline):
    model = Attendance
    extra = 1
    readonly_fields = ('date',)

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price_at_purchase')

# --- 3. Advertisement Management (Header/Sidebar/Popup) ---

@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = ('preview_img', 'title', 'location', 'is_active')
    list_editable = ('is_active', 'location')
    list_filter = ('location', 'is_active')
    
    def preview_img(self, obj):
        if obj.image:
            # Displays the ad in the list so you can see if it fits the header/sidebar
            return format_html('<img src="{}" style="width: 150px; height: auto; border-radius: 5px; border: 1px solid #eee;" />', obj.image.url)
        return "No Image"
    preview_img.short_description = "Ad Preview"

# --- 4. Product Management (With Gallery) ---

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('thumbnail_tag', 'name', 'category', 'price')
    list_filter = ('category',)
    search_fields = ('name', 'description')
    
    # This enables the "Add more images" section at the bottom of the Product page
    inlines = [ProductImageInline]

    def thumbnail_tag(self, obj):
        if hasattr(obj, 'main_image') and obj.main_image:
            return format_html('<img src="{}" style="width: 45px; height: 45px; border-radius: 5px; object-fit: cover;" />', obj.main_image.url)
        return "No Image"

# --- 5. HRM & Employee Management ---

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'full_name', 'department', 'position', 'is_active')
    search_fields = ('first_name', 'last_name', 'employee_id')
    inlines = [AttendanceInline]

    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

@admin.register(PerformanceReview)
class PerformanceReviewAdmin(admin.ModelAdmin):
    list_display = ('employee', 'review_date', 'rating', 'reviewer')
    list_filter = ('rating',)

@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ('employee', 'pay_period', 'amount', 'is_paid')

# --- 6. Orders & Transactions ---

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'total_price', 'status', 'created_at', 'get_receipt_button')
    inlines = [OrderItemInline]

    def get_receipt_button(self, obj):
        url = f"{INVOICE_SERVICE_URL}/api/invoices/generate?order_id={obj.id}"
        return format_html(
            '<a class="button" href="{}" target="_blank" style="background: #2e7d32; color: white; padding: 5px 10px; border-radius: 4px; text-decoration: none;">View Invoice</a>', 
            url
        )

# --- 7. Missing Registrations (Fixes the 404 Errors) ---

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    """Explicitly register this so the /productimage/add/ URL exists"""
    list_display = ('product', 'alt_text', 'image')

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity')

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'status')