from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from super_mart import views 

router = DefaultRouter()
router.register(r'products', views.ProductViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Core API Endpoints
    path('api/', include(router.urls)),
    
    # Authentication & CSRF
    path('api/register/', views.register_user, name='register'),
    path('api/login/', views.login_user, name='login'),
    path('api/get-csrf-token/', views.get_csrf_token, name='get-csrf-token'), # <--- ADD THIS
    
    # HRM & Marketplace
    path('api/employees/<str:employee_id>/', views.employee_detail_api),
    path('api/orders/', views.order_list, name='order-list'), 
    path('api/orders/<int:order_id>/', views.get_order_detail, name='order-detail'),
]

# Serving Static/Media in Development/Render Debug mode
if settings.DEBUG:
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)