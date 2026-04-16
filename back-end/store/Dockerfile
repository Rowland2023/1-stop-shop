FROM python:3.11-slim

# Prevent Python from buffering stdout/stderr
ENV PYTHONUNBUFFERED 1
WORKDIR /app

# Install system dependencies (including netcat/curl for debugging if needed)
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# --- STATIC & MEDIA PREPARATION ---
# Create the media directory explicitly so permissions are set
RUN mkdir -p /app/media /app/staticfiles

# Set dummy environment variables for build-time operations
ENV SECRET_KEY=build-time-key-only
ENV DEBUG=False

# Collect static files for Whitenoise to serve CSS/JS
RUN python manage.py collectstatic --no-input

# Expose the port (Render default)
EXPOSE 8000

# --- THE EXECUTION ---
# Migrations run first. If they fail, the container crashes and prevents 
# a broken app from trying to serve traffic.
CMD ["sh", "-c", "python manage.py migrate --no-input && gunicorn store.wsgi:application --bind 0.0.0.0:8000"]