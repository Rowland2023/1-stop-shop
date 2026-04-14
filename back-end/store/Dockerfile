# Use a slim version of Python for a smaller footprint
FROM python:3.11-slim


# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies (needed for Postgres/Pillow)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. FIX: Updated path to find requirements.txt from the 'market-place/' root
COPY back-end/store/requirements.txt . 

# 2. Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 3. FIX: Copy the back-end contents into /app
# This ensures manage.py is in the root of /app
COPY back-end/ .

# Expose Render's default port
EXPOSE 10000


# RUNTIME OPTIMIZATION
# Since manage.py is now in /app, these commands will work perfectly.
CMD ["sh", "-c", "python manage.py collectstatic --no-input && python manage.py migrate && gunicorn store.wsgi:application --bind 0.0.0.0:10000 --timeout 120 --workers 3"]

# RUNTIME OPTIMIZATION: 
# We run collectstatic and migrate at start, not during build.
# This prevents 'ImportError' from killing the image creation.
CMD ["sh", "-c", "python manage.py collectstatic --no-input && python manage.py migrate && gunicorn store.wsgi:application --bind 0.0.0.0:10000 --timeout 120 --workers 3"]

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Install system dependencies for Pillow and Postgres
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY back-end/store/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY back-end/store/ .
RUN mkdir -p /app/staticfiles

# Note: collectstatic may fail here if DATABASE_URL isn't present during build.
# It is often safer to run collectstatic in the CMD or via a separate build step.
RUN python manage.py collectstatic --no-input --no-post-process

CMD python manage.py migrate && gunicorn store.wsgi:application --bind 0.0.0.0:10000 --timeout 120 --workers 3 --log-level debug


