from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from super_mart import views 

router = DefaultRouter()
router.register(r'products', views.ProductViewSet)
router.register(r'orders', views.OrderViewSet) # Using the ViewSet for CRUD operations

urlpatterns = [
    path('', views.api_root_view, name='root-landing'),
    path('admin/', admin.site.urls),
    
    # API Routes
    path('api/', include(router.urls)),
    path('api/register/', views.register_user, name='register'),
    path('api/login/', views.login_user, name='login'),
    path('api/verify-payment/', views.verify_payment, name='verify_payment'),
    path('api/get-csrf-token/', views.get_csrf_token, name='get-csrf-token'),
    path('api/employees/<str:employee_id>/', views.employee_detail_api, name='employee-detail'),
    
    # Print/Report Routes
    path('receipt/<int:order_id>/', views.print_receipt, name='print_receipt'),
    path('payroll/print/<int:payroll_id>/', views.print_payroll, name='print_payroll'),
]

# Serving Static/Media
if settings.DEBUG:
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)