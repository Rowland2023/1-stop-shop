from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from super_mart import views 

# 1. Root Landing Page View
# Provides a simple health-check page for your Render deployment
def api_root_view(request):
    return HttpResponse("""
        <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1 style="color: #2c3e50;">Lagos Tech Hub: Market-place API is Live</h1>
            <p style="color: #7f8c8d;">Your backend is successfully deployed on Render.</p>
            <hr style="width: 50%; border: 0; border-top: 1px solid #eee; margin: 20px auto;">
            <p>Navigate to: 
                <a href='/api/products/'>Products API</a> | 
                <a href='/admin/'>Admin Panel</a>
            </p>
        </div>
    """)

# 2. REST Framework Router Configuration
# Automatically handles list and detail URLs for products
router = DefaultRouter()
router.register(r'products', views.ProductViewSet, basename='product')

# 3. URL Patterns
urlpatterns = [
    # General Routes
    path('', api_root_view, name='root-landing'),
    path('admin/', admin.site.urls),
    
    # API Routes
    path('api/', include(router.urls)), # Creates /api/products/ and /api/products/<id>/
    path('api/orders/', views.order_list, name='order-list'), 
    path('api/orders/<int:order_id>/', views.get_order_detail, name='order-detail'),
    path('api/register/', views.register_user, name='register'),
    path('api/login/', views.login_user, name='login'),
    path('api/employees/<str:employee_id>/', views.employee_detail_api, name='employee-detail'),
]

# 4. Static and Media File Handling
# This ensures Django knows how to route requests for CSS, JS, and Images.
# In production, WhiteNoise handles Static, and Cloudinary handles Media.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)