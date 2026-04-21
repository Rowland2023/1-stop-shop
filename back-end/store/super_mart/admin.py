from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum
from .models import (
    Employee, Attendance, Payroll, PerformanceReview, 
    Product, Order, OrderItem, ProductImage
)

# --- 1. Global Branding ---
admin.site.site_header = "Lagos Tech Hub: Market-Place & HRM"
admin.site.index_title = "Command Center"

# --- 2. Inlines (Fixes the 404 by embedding images) ---
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 2

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity')

# --- 3. Model Admins ---
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    # Added 'image_display' to the fields list so it actually shows up in the form
    fields = ('name', 'price', 'category', 'image_display', 'main_image','description') 
    list_display = ('thumbnail', 'name', 'category', 'price', 'get_image_source')
    inlines = [ProductImageInline]

    def thumbnail(self, obj):
        # Focus on the new Cloudinary field
        if obj.image_display:
            return format_html('<img src="{}" style="width: 50px; height: 50px; border-radius: 4px;" />', obj.image_display.url)
        if obj.main_image:
            return format_html('<img src="{}" style="width: 50px; height: 50px; border-radius: 4px;" />', obj.main_image.url)
        return "No Image"

    def get_image_source(self, obj):
        if obj.image_display: return "Cloudinary (Display)"
        if obj.main_image: return "Admin Upload (Main)"
        return "Missing"
    
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    # Use fieldsets to fix the layout issue
    fieldsets = (
        ('General Information', {
            'fields': ('name', 'price', 'category')
        }),
        ('Description & Media', {
            'fields': ('description', 'image_display', 'main_image')
        }),
    )
    list_display = ('thumbnail', 'name', 'category', 'price', 'get_image_source')
    inlines = [ProductImageInline]

    # You can safely remove the 'save_model' method entirely now
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'total_price', 'status', 'download_receipt')
    inlines = [OrderItemInline]

    def download_receipt(self, obj):
        # UPDATED: Pointing to your live Render Invoice service
        invoice_url = f"https://invoice-service-ttn6.onrender.com/api/invoices/generate?order_id={obj.id}"
        return format_html('<a href="{}" target="_blank" style="background:#2e7d32; color:white; padding:5px; border-radius:4px;">Receipt</a>', invoice_url)

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'first_name', 'last_name', 'department', 'is_active')

# Registering these as standalone pages so they show up in the sidebar
admin.site.register(Attendance)
admin.site.register(Payroll)
admin.site.register(OrderItem)