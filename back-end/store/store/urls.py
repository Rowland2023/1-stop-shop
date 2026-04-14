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
    
    # --- MARKETPLACE & PRODUCT APIs ---
    path('api/', include(router.urls)),
    path('api/orders/', views.order_list, name='order-list'), 
    path('api/orders/<int:order_id>/', views.get_order_detail, name='order-detail'),
    
    # --- AUTH APIs ---
    path('api/register/', views.register_user, name='register'),
    path('api/login/', views.login_user, name='login'),
    
    # --- HRM API ---
    # Using a trailing slash is a Django convention that prevents 301 redirects
    path('api/employees/<str:employee_id>/', views.employee_detail_api, name='employee-detail'),
]

# --- STATIC & MEDIA HANDLERS ---
if settings.DEBUG:
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns
    # Serves /static/ files (like your manual image paths)
    urlpatterns += staticfiles_urlpatterns()
    # Serves /media/ files (like admin-uploaded product images)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # In production (Render), Nginx or WhiteNoise usually handles static.
    # But adding this ensures media uploads still work if not using S3.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)