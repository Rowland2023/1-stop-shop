from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from super_mart import views 
from super_mart.views import api_root_view


router = DefaultRouter()
router.register(r'products', views.ProductViewSet)

urlpatterns = [
    path('', api_root_view, name='root-landing'),
    path('admin/', admin.site.urls),
    
    # API Routes
    path('api/', include(router.urls)),
    path('api/orders/', views.order_list, name='order-list'), 
    path('api/orders/<int:order_id>/', views.get_order_detail, name='order-detail'),
    path('api/register/', views.register_user, name='register'),
    path('api/login/', views.login_user, name='login'),
    # ADDED THIS LINE BELOW:
    path('api/get-csrf-token/', views.get_csrf_token, name='get-csrf-token'),
    path('api/employees/<str:employee_id>/', views.employee_detail_api, name='employee-detail'),
]

# Serving Static/Media in Development/Render Debug mode
if settings.DEBUG:
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns
    urlpatterns += staticfiles_urlpatterns()
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)