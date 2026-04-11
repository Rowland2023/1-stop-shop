"""
Django settings for store project.
Unified PostgreSQL & Redis Configuration
"""

import os
import dj_database_url
from pathlib import Path

# --- 1. BASE PATHS ---
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-_m6@*&@vaop567))d(y20&&+_ne_$0p%-^e7ap94(gfsw4izjm'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

# --- 2. APPLICATION DEFINITION ---

INSTALLED_APPS = [
    'jazzmin',              # Must be above admin
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'cloudinary_storage',
    'cloudinary',
    'corsheaders',
    'rest_framework',
    
    # Internal apps
    'super_mart',           
]

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET')
}

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be as high as possible
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'store.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'store.wsgi.application'

# --- 3. DATABASE CONFIGURATION (PostgreSQL) ---

DATABASES = {
    'default': dj_database_url.config(
        # Default to the internal Docker service name "database"
        default=os.getenv('DATABASE_URL', 'postgres://admin:marketpass@database:5432/market_place_db'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# --- 4. ASYNCHRONOUS TASKS (Celery & Redis) ---

CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Africa/Lagos'

# --- 5. AUTH & REST FRAMEWORK ---

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [], 
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}

# --- 6. INTERNATIONALIZATION ---

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Lagos'
USE_I18N = True
USE_TZ = True

# --- 7. STATIC & MEDIA FILES ---

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# --- 8. SECURITY & CORS ---

CORS_ALLOW_ALL_ORIGINS = True  # Optimized for dev; restrict this in prod
APPEND_SLASH = True
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# --- 9. JAZZMIN UI CUSTOMIZATION ---

JAZZMIN_SETTINGS = {
    "site_title": "Lagos Tech Hub Admin",
    "site_header": "Market-Place HRM",
    "site_brand": "Command Center",
    "welcome_sign": "Welcome to the Market-Place Management Portal",
    "copyright": "Lagos Tech Hub Ltd",
    "search_model": ["super_mart.Employee", "super_mart.Product"],
    "show_sidebar": True,
    "navigation_expanded": True,
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "super_mart.Employee": "fas fa-user-tie",
        "super_mart.Product": "fas fa-box-open",
        "super_mart.Attendance": "fas fa-calendar-check",
        "super_mart.Payroll": "fas fa-money-bill-wave",
        "super_mart.PerformanceReview": "fas fa-chart-line",
        "super_mart.Department": "fas fa-sitemap",
    },
    "order_with_respect_to": ["super_mart.Employee", "super_mart.Product", "super_mart.Department"],
    "use_google_fonts": True,
}

JAZZMIN_UI_TWEAKS = {
    "navbar_fixed": True,
    "sidebar_fixed": True,
    "theme": "default",
    "sidebar": "sidebar-dark-primary",
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'