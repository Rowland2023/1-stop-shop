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

# Install Python dependencies
COPY store/requirements.txt . 
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Expose Render's default port
EXPOSE 10000

# RUNTIME OPTIMIZATION: 
# We run collectstatic and migrate at start, not during build.
# This prevents 'ImportError' from killing the image creation.
CMD ["sh", "-c", "python manage.py collectstatic --no-input && python manage.py migrate && gunicorn store.wsgi:application --bind 0.0.0.0:10000 --timeout 120 --workers 3"]