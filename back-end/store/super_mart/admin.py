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

# --- 1. THE MULTI-IMAGE INLINE ---

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    # This creates 3 empty slots by default, but you can add INFINITE images 
    # by clicking "Add another Product Image" in the admin.
    extra = 3 
    fields = ('image', 'alt_text', 'preview_image')
    readonly_fields = ('preview_image',)

    def preview_image(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 80px; height: auto; border-radius: 5px;"/>', obj.image.url)
        return ""

# --- 2. PRODUCT ADMIN (The Main Controller) ---

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('thumbnail_tag', 'name', 'category', 'price')
    list_filter = ('category',)
    search_fields = ('name',)
    
    # This connects the multi-image gallery to the Product page
    inlines = [ProductImageInline]

    fieldsets = (
        ("Main Details", {
            'fields': ('name', 'description', 'category', 'price')
        }),
        ("Primary Thumbnail", {
            'fields': ('main_image', 'image_path'),
            'description': "This is the main image seen on the shop list."
        }),
    )

    def thumbnail_tag(self, obj):
        if obj.main_image:
            return format_html('<img src="{}" style="width: 45px; height: 45px; border-radius: 5px; object-fit: cover;" />', obj.main_image.url)
        return "No Image"

# --- 3. ADVERTISEMENT MANAGEMENT (Multi-Position) ---

@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = ('preview_img', 'title', 'location', 'is_active')
    list_editable = ('is_active', 'location')
    
    def preview_img(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 100px; border-radius: 5px;" />', obj.image.url)
        return "No Image"

# --- 4. HRM & OTHER REGISTRATIONS ---

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'first_name', 'last_name', 'department', 'is_active')
    inlines = [AttendanceInline] if 'AttendanceInline' in locals() else []

@admin.register(PerformanceReview)
class PerformanceReviewAdmin(admin.ModelAdmin):
    list_display = ('employee', 'review_date', 'rating')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'total_price', 'status', 'get_receipt_button')
    
    def get_receipt_button(self, obj):
        url = f"{INVOICE_SERVICE_URL}/api/invoices/generate?order_id={obj.id}"
        return format_html('<a class="button" href="{}" target="_blank" style="background:#2e7d32; color:white; padding:4px; border-radius:4px;">Invoice</a>', url)

# Final registrations for remaining models
admin.site.register(Department)
admin.site.register(Payroll)
admin.site.register(Attendance)