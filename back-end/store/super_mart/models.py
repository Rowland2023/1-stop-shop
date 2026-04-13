from django.db import models
from cloudinary.models import CloudinaryField

# --- 1. SHARED INFRASTRUCTURE ---

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if self.name:
            self.name = self.name.strip()
        super().save(*args, **kwargs)

# --- 2. MARKETPLACE & INVENTORY ---

class Product(models.Model):
    CATEGORY_CHOICES = [
        ('food', 'Food & Drinks'),
        ('electronics', 'Electronics'),
        ('office', 'Office Supplies'),
        ('style&fashion', 'Style & Fashion'),
        ('sex-toys', 'Sex-Toys'),
        ('rent-house','House-Rent'),
        ('car-sales','Car-Sales'),
        ('kitchen-items','Kitchen-Items'),
        # Add others as needed
    ]
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    
    # Using Cloudinary for the main image
    main_image = CloudinaryField('image', null=True, blank=True)
    
    def __str__(self):
        return self.name

    @property
    def image_display(self):
        """Helper for the Frontend to get the main image URL safely"""
        if self.main_image:
            return self.main_image.url
        return "/static/placeholder.png"

class ProductImage(models.Model):
    """The 'Review' or 'Gallery' images for a product"""
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    # Using Cloudinary here too fixes the 'broken review images' issue
    image = CloudinaryField('image', null=True, blank=True) 
    alt_text = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Image for {self.product.name}"

# --- 3. ADVERTISEMENTS ---

class Advertisement(models.Model):
    LOCATION_CHOICES = [
        ('header_main', 'Header Main Banner'),
        ('sidebar', 'Sidebar Ad'),
        ('popup', 'Popup Promo'),
    ]
    title = models.CharField(max_length=200)
    image = CloudinaryField('image')
    link_url = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=50, choices=LOCATION_CHOICES, default='header_main')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.location})"

# --- 4. ORDERS & TRANSACTIONS ---

class Order(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    ]
    user_id = models.CharField(max_length=100)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - {self.user_id}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price_at_purchase = models.DecimalField(max_digits=12, decimal_places=2)

# --- 5. HRM & EMPLOYEE MANAGEMENT ---

class Employee(models.Model):
    employee_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='employees')
    position = models.CharField(max_length=100)
    salary = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Attendance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    check_in = models.TimeField()
    check_out = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[('Present', 'Present'), ('Absent', 'Absent'), ('Late', 'Late')])

class Payroll(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payrolls')
    pay_period = models.CharField(max_length=50) 
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_paid = models.BooleanField(default=False)

class PerformanceReview(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='reviews')
    review_date = models.DateField()
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    reviewer = models.CharField(max_length=100)