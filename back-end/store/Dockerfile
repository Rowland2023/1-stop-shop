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

# Create the directory for static files (matching your settings.py STATIC_ROOT)
RUN mkdir -p /app/staticfiles

# --- THE FIX ---
# Collect static files during the image build process
# This populates the /app/staticfiles directory so WhiteNoise can find them
RUN python manage.py collectstatic --no-input

# Run migrations and start the server using a shell-form CMD
# This ensures the database is ready before the API starts
CMD python manage.py migrate && gunicorn store.wsgi:application --bind 0.0.0.0:10000