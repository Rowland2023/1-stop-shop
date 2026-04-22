from django.db import models
from django.contrib.auth.models import User
from cloudinary.models import CloudinaryField


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15, unique=True)
    date_created = models.DateTimeField(auto_now_add=True) # Added this
    
    def __str__(self):
        return f"{self.phone_number} - {self.user.first_name}"

# --- 1. MARKETPLACE & INVENTORY ---

class Product(models.Model):
    CATEGORY_CHOICES = [
        ('food', 'Food & Drinks'),
        ('electronics', 'Electronics'),
        ('office', 'Office Supplies'),
        ('style&fashion', 'Style & Fashion'),
        ('home', 'Home & Garden'),  
        ('toys', 'Toys & Games '),
        ('health', 'Health & Beauty'),
        ('sports', 'Sports & Outdoors'),
        ('automotive', 'Automotive'),
        ('books', 'Books & Media'),
        ('miscKitchen', 'Kitchen & Dining'),
        ('sex-toys', 'Sex-Toys'),
        ('rent-house','House-Rent'),
        ('car-sales','Car-Sales'),
        ('kitchen-items','Kitchen-Items'),
    ]
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    main_image = CloudinaryField('image', null=True, blank=True)
    image_display = CloudinaryField('image', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    image = CloudinaryField('image', null=True, blank=True) 
    alt_text = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Image for {self.product.name}"
class Order(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Shipped', 'Shipped'),
        ('Delivered', 'Delivered'),
        ('Cancelled', 'Cancelled'),
    ]
    user_id = models.CharField(max_length=100)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id} - {self.status}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price_at_purchase = models.DecimalField(max_digits=12, decimal_places=2)

# --- 2. EMPLOYEE MANAGEMENT (HRM) ---

class Employee(models.Model):
    employee_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    department = models.CharField(max_length=100)
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
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2 , default=0.00) # Ensure this matches
    amount = models.DecimalField(max_digits=12, decimal_places=2 , default=0.00)
    is_paid = models.BooleanField(default=False)

class PerformanceReview(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='reviews')
    review_date = models.DateField()
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    reviewer = models.CharField(max_length=100)