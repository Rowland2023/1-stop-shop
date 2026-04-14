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

# --- 2. Inlines (Gallery / Review Images) ---

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3  
    fields = ('image', 'alt_text', 'image_preview')
    readonly_fields = ('image_preview',)

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 80px; height: auto; border-radius: 4px;" />', obj.image.url)
        return "Pending Upload"

# --- 3. Product & Inventory Management ---

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('thumbnail_tag', 'name', 'category', 'price', 'is_featured')
    list_filter = ('category', 'created_at')
    search_fields = ('name', 'description')
    list_editable = ('price',)
    inlines = [ProductImageInline]

    fieldsets = (
        ("General Information", {
            'fields': ('name', 'category', 'price', 'image_display')
        }),
        ("Product Details & SEO", {
            'classes': ('collapse',), 
            'fields': ('description',),
        }),
    )

    def thumbnail_tag(self, obj):
        if obj.image_display:
            return format_html('<img src="{}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;" />', obj.image_display.url)
        return "No Image"
    thumbnail_tag.short_description = "General Image"

    def is_featured(self, obj):
        return True 
    is_featured.boolean = True

# --- 4. Standalone Image Management ---

# FIX: Removed @admin.register(ProductImage) because it is already used in the Inline.
# If you want a separate menu for images, keep the class but ensure it's not conflicting.
# For a clean UI, we keep it as a standalone admin too.
@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'image_preview', 'alt_text')
    readonly_fields = ('image_preview',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width: 50px; height: auto;" />', obj.image.url)
        return "No Image"

# --- 5. HRM & Transactions ---

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'total_price', 'status', 'get_receipt_button')
    
    def get_receipt_button(self, obj):
        url = f"{INVOICE_SERVICE_URL}/api/invoices/generate?order_id={obj.id}"
        return format_html('<a class="button" href="{}" target="_blank" style="background:#2e7d32;color:white;padding:4px 8px;border-radius:4px;">View Invoice</a>', url)
    get_receipt_button.short_description = "Invoicing"

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'first_name', 'last_name', 'department', 'is_active')

# --- 6. Final Registrations ---
# Crucial: Ensure these are not registered twice with @decorators above.
admin.site.register(Department)
admin.site.register(Attendance)
admin.site.register(Payroll)
admin.site.register(PerformanceReview)
admin.site.register(Advertisement)