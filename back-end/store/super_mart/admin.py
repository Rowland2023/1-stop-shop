from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum
from .models import (
    Employee, Attendance, Payroll, PerformanceReview, 
    Product, Order, OrderItem, ProductImage
)

# --- 1. Global Site Branding ---
admin.site.site_header = "Lagos Tech Hub: Market-Place & HRM"
admin.site.site_title = "Admin Portal"
admin.site.index_title = "Command Center"

# --- 2. Inlines ---

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3  # Slots for selective pictures

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity')
    can_delete = False

class AttendanceInline(admin.TabularInline):
    model = Attendance
    extra = 0
    readonly_fields = ('date', 'status')
    can_delete = False

class PayrollInline(admin.StackedInline):
    model = Payroll
    extra = 0
    classes = ('collapse',)

# --- 3. Product Management (Merged & Fixed) ---

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('thumbnail', 'name', 'category', 'price', 'get_image_source')
    list_filter = ('category',)
    search_fields = ('name',)
    inlines = [ProductImageInline] # This restores the "Product images" tag

    def thumbnail(self, obj):
        # 1. Check for Admin Upload
        if obj.main_image:
            return format_html('<img src="{}" style="width: 50px; height: 50px; border-radius: 4px;" />', obj.main_image.url)
        # 2. Check for Manual static/ path
        if obj.image_path:
            return format_html('<img src="/static/{}" style="width: 50px; height: 50px;" />', obj.image_path)
        return "No Image"

    def get_image_source(self, obj):
        if obj.main_image: return "Admin Uploaded"
        if obj.image_path: return f"Static: {obj.image_path}"
        return "Missing"

# --- 4. Order & Tracking Management ---

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'total_price', 'status', 'created_at', 'download_receipt')
    list_editable = ('status',) 
    list_filter = ('status', 'created_at')
    search_fields = ('id', 'user_id')
    ordering = ('-created_at',)
    inlines = [OrderItemInline]

    def download_receipt(self, obj):
        fastapi_url = f"http://localhost:8001/api/invoices/generate?order_id={obj.id}"
        return format_html('<a class="button" href="{}" target="_blank" style="background-color: #2e7d32; color: white; padding: 5px; border-radius: 4px; text-decoration: none;">Receipt</a>', fastapi_url)
    download_receipt.short_description = "Action"

    def changelist_view(self, request, extra_context=None):
        total_revenue = Order.objects.filter(status="Paid").aggregate(Sum('total_price'))['total_price__sum'] or 0
        latest_transactions = Order.objects.all().order_by('-created_at')[:5]
        top_products = Product.objects.annotate(
            total_sold=Sum('orderitem__quantity')
        ).filter(total_sold__gt=0).order_by('-total_sold')[:5]

        extra_context = extra_context or {}
        extra_context['total_revenue'] = total_revenue
        extra_context['latest_transactions'] = latest_transactions
        extra_context['top_products'] = top_products
        return super().changelist_view(request, extra_context=extra_context)

# --- 5. HRM & Employee Management ---

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('employee_id', 'full_name', 'department', 'position', 'get_status_badge')
    list_filter = ('department', 'is_active', 'position')
    search_fields = ('first_name', 'last_name', 'employee_id')
    inlines = [AttendanceInline, PayrollInline]

    def full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
    def get_status_badge(self, obj):
        color = "green" if obj.is_active else "red"
        return format_html('<span style="color: {}; font-weight: bold;">{}</span>', 
                           color, "ACTIVE" if obj.is_active else "INACTIVE")

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'status')

@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ('employee', 'pay_period', 'amount', 'is_paid', 'download_payslip')
    
    def download_payslip(self, obj):
        emp_id = str(obj.employee.employee_id).strip()
        fastapi_url = f"http://localhost:8001/api/invoices/generate?user_id={emp_id}"
        return format_html('<a class="button" href="{}" target="_blank" style="background-color: #447e9b; color: white; padding: 5px; border-radius: 4px; text-decoration: none;">PDF</a>', fastapi_url)

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity')