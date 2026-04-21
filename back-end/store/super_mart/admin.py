from django.contrib import admin
from django.contrib.auth.models import User
from django.utils.html import format_html
from django.contrib.auth.admin import UserAdmin
from .models import (
    Employee, Attendance, Payroll, PerformanceReview, 
    Product, Order, OrderItem, ProductImage
)

# --- Register User with Profile Inline ---
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False

# Unregister default User to customize it
admin.site.unregister(User)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    inlines = (ProfileInline,)
    list_display = ('username', 'email', 'get_phone') # Shows phone in list

    def get_phone(self, obj):
        # This pulls the phone from your Profile model
        return obj.profile.phone_number if hasattr(obj, 'profile') else "N/A"
    get_phone.short_description = 'Phone Number'

# --- Register your Profile model explicitly ---
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number')
    
# --- 1. Global Branding ---
admin.site.site_header = "Lagos Tech Hub: Market-Place & HRM"
admin.site.index_title = "Command Center"

# --- 2. Inlines ---
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity')

# --- 3. Model Admins ---

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    fields = ('name', 'price', 'category', 'image_display', 'main_image', 'description') 
    list_display = ('thumbnail', 'name', 'category', 'price', 'get_image_source')
    inlines = [ProductImageInline]

    def thumbnail(self, obj):
        if hasattr(obj, 'image_display') and obj.image_display:
            return format_html('<img src="{}" style="width: 50px; height: 50px; border-radius: 4px;" />', obj.image_display.url)
        if hasattr(obj, 'main_image') and obj.main_image:
            return format_html('<img src="{}" style="width: 50px; height: 50px; border-radius: 4px;" />', obj.main_image.url)
        return "No Image"

    def get_image_source(self, obj):
        if hasattr(obj, 'image_display') and obj.image_display: return "Cloudinary"
        if hasattr(obj, 'main_image') and obj.main_image: return "Admin Upload"
        return "Missing"

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'total_price', 'status', 'download_receipt')
    inlines = [OrderItemInline]

    def download_receipt(self, obj):
        invoice_url = f"https://invoice-service-ttn6.onrender.com/api/invoices/generate?order_id={obj.id}"
        return format_html('<a href="{}" target="_blank" style="background:#2e7d32; color:white; padding:5px; border-radius:4px;">Receipt</a>', invoice_url)

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'first_name', 'last_name', 'department', 'is_active')

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'status')

@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ('employee', 'pay_period', 'gross_salary', 'amount', 'is_paid')

@admin.register(PerformanceReview)
class PerformanceReviewAdmin(admin.ModelAdmin):
    list_display = ('employee', 'review_date', 'rating')

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity')