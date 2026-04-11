from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from super_mart import views 
from django.http import HttpResponse # Add this import
def api_root_view(request):
    return HttpResponse("<h1>Market-place API is Live</h1><p>Navigate to <a href='/api/'>/api/</a> or <a href='/admin/'>/admin/</a></p>")

router = DefaultRouter()
router.register(r'products', views.ProductViewSet)

urlpatterns = [
    path('', api_root_view),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/orders/', views.order_list, name='order-list'), 
    path('api/orders/<int:order_id>/', views.get_order_detail, name='order-detail'),
    path('api/register/', views.register_user, name='register'),
    path('api/login/', views.login_user, name='login'),
    path('api/employees/<str:employee_id>/', views.employee_detail_api, name='employee-detail'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)