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
    '.onrender.com',
    'localhost',
    '127.0.0.1'
]

# --- 3. APPLICATION DEFINITION ---
INSTALLED_APPS = [
    'cloudinary_storage',         # Must be before staticfiles
    'django.contrib.staticfiles', 
    'jazzmin',                    # Must be before admin
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
    'corsheaders.middleware.CorsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', 
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'store.urls'

# --- CRITICAL FIX FOR admin.E403 ---
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.static',  # Added
                'django.template.context_processors.media',   # Added
            ],
        },
    },
]

WSGI_APPLICATION = 'store.wsgi.application'

# --- 4. DATABASE ---
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
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
}

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
MEDIA_URL = '/media/'

# --- 6. SECURITY & CORS ---
CORS_ALLOWED_ORIGINS = [
    'https://front-end-6f9m.onrender.com',
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    'https://front-end-6f9m.onrender.com',
    'https://back-end-wdk7.onrender.com',
]

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True
SECURE_SSL_REDIRECT = False 
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
APPEND_SLASH = True

# --- 7. REST FRAMEWORK ---
REST_FRAMEWORK = {
    'COERCE_DECIMAL_TO_STRING': True,
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.AllowAny'],
}

# --- 8. INTERNATIONALIZATION ---
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Lagos'
USE_I18N = True
USE_TZ = True

# --- 9. JAZZMIN UI SETTINGS ---
JAZZMIN_SETTINGS = {
    "site_title": "Lagos Tech Hub Admin",
    "site_header": "Market-Place HRM",
    "site_brand": "Command Center",
    "welcome_sign": "Welcome to the Management Portal",
    "copyright": "Lagos Tech Hub Ltd",
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'