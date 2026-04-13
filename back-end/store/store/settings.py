import os
import dj_database_url
from pathlib import Path

# --- 1. BASE PATHS ---
BASE_DIR = Path(__file__).resolve().parent.parent

# --- 2. SECURITY ---
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-your-fallback-key')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = [
    'back-end-wdk7.onrender.com', 
    'front-end-6f9m.onrender.com',
    'back-end-wdk7', # Internal Render Name
    'localhost',
    '127.0.0.1'
]

# --- 3. APPLICATION DEFINITION ---
INSTALLED_APPS = [
    # CLOUDINARY MUST BE TOP
    'cloudinary_storage', 
    'django.contrib.staticfiles',
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    
    # Third-party
    'cloudinary',
    'corsheaders',
    'rest_framework',
    
    # Internal
    'super_mart',           
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware', # Keep near top
    'whitenoise.middleware.WhiteNoiseMiddleware', 
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# --- 4. DATABASE (Performance Optimized) ---
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL', f"sqlite:///{BASE_DIR}/db.sqlite3"),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# --- 5. STATIC & MEDIA FILES ---
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Use WhiteNoise for static, Cloudinary for Media
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
}

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
MEDIA_URL = '/media/'

# --- 6. SECURITY & CORS (Proxy Aware) ---
CORS_ALLOWED_ORIGINS = [
    'https://front-end-6f9m.onrender.com',
]
CORS_ALLOW_CREDENTIALS = True

# Django requires the protocol (https://) in trusted origins
CSRF_TRUSTED_ORIGINS = [
    'https://front-end-6f9m.onrender.com',
    'https://back-end-wdk7.onrender.com',
]

# PROXY HEADERS: Tells Django it's behind Nginx
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

# Production SSL settings (Keep False if Nginx terminates SSL)
SECURE_SSL_REDIRECT = False 
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
APPEND_SLASH = True

# --- 7. REST FRAMEWORK ---
REST_FRAMEWORK = {
    'COERCE_DECIMAL_TO_STRING': True,
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}

# --- 8. INTERNATIONALIZATION ---
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Lagos'
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'