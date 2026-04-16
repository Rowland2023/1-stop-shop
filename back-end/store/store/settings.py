from pathlib import Path
import os
import dj_database_url  # You may need to run: pip install dj-database-url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-_m6@*&@vaop567))d(y20&&+_ne_$0p%-^e7ap94(gfsw4izjm')

# Set to False in production!
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = ['back-end-wdk7.onrender.com', 'frontend-rdmj.onrender.com', 'localhost', '127.0.0.1']

# --- Application definition ---

INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'super_mart',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # MUST BE AT THE TOP
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # For static files on Render
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'store.urls'

# --- CORS & SECURITY ---

CORS_ALLOWED_ORIGINS = [
    "http://localhost:8001",
    "http://127.0.0.1:8001",
    "http://localhost:3000",
    "https://frontend-rdmj.onrender.com", # Your Render Frontend
]

# CRITICAL for Registration/Login to work
CSRF_TRUSTED_ORIGINS = [
    "https://frontend-rdmj.onrender.com",
    "https://back-end-wdk7.onrender.com",
]

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# --- Database ---
# Uses DATABASE_URL environment variable on Render, falls back to SQLite for local dev
DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600
    )
}

# --- REST Framework ---

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}

# --- Static & Media Files ---

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# --- Jazzmin Settings (Keeping your UI tweaks) ---

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
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'