FROM python:3.11-slim

# Prevents Python from writing .pyc files and keeps logs visible
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Copy requirements from your repo structure
COPY back-end/store/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy the actual project code
COPY back-end/store/ .

# Create the directory for static files
RUN mkdir -p /app/staticfiles

# Collect static files during the image build process
RUN python manage.py collectstatic --no-input

# --- THE CRITICAL FIX ---
# Use Shell form (no brackets) to chain the migration and the server start
# This ensures the DB is ready before Gunicorn takes requests
CMD python manage.py migrate && gunicorn store.wsgi:application --bind 0.0.0.0:10000 --timeout 120 --workers 3 --log-level debug