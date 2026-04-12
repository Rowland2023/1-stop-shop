import os
import dj_database_url
from pathlib import Path

# --- 1. BASE PATHS ---
BASE_DIR = Path(__file__).resolve().parent.parent

# --- 2. SECURITY ---
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-your-fallback-key')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = [
    'back-end-wdk7', 
    'back-end-wdk7.onrender.com', 
    'front-end-6f9m.onrender.com',
    'localhost',
    '127.0.0.1'
]

# --- 3. APPLICATION DEFINITION ---
INSTALLED_APPS = [
    'django.contrib.staticfiles',  # 1. Native static first
    'cloudinary_storage',         # 2. Cloudinary storage
    'jazzmin',                    # 3. Jazzmin (Must be before admin)
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
    'whitenoise.middleware.WhiteNoiseMiddleware', # Immediately after Security
    'corsheaders.middleware.CorsMiddleware', 
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
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
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

# STATIC FILES (WhiteNoise handles CSS/JS for the UI)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Storage for Static - Optimized for WhiteNoise on Render
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
WHITENOISE_MANIFEST_STRICT = False 

# MEDIA FILES (Cloudinary handles Persistent Product Images)
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
    'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
    'STATICFILES_STORAGE': None,  # Decouples static from Cloudinary
}

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# --- 6. SECURITY & CORS ---
CORS_ALLOW_ALL_ORIGINS = True 
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = [
    'https://back-end-wdk7.onrender.com',
    'https://front-end-6f9m.onrender.com'
]

APPEND_SLASH = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# --- 7. REST FRAMEWORK ---
REST_FRAMEWORK = {
    'COERCE_DECIMAL_TO_STRING': True,
    'DEFAULT_AUTHENTICATION_CLASSES': [], 
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
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
    "show_sidebar": True,
    "navigation_expanded": True,
    "icons": {
        "auth.user": "fas fa-user",
        "super_mart.Product": "fas fa-box-open",
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Tell Django it is behind a proxy and to trust the X-Forwarded-Proto header
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Add this to prevent Gunicorn from dropping connections due to protocol confusion
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True