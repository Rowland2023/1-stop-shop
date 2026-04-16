FROM python:3.11-slim

# Prevent Python from buffering stdout/stderr
ENV PYTHONUNBUFFERED 1
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# --- NEW: STATIC FILES HANDLING ---
# Set dummy environment variables so collectstatic runs during build
ENV SECRET_KEY=build-time-key-only
ENV DEBUG=False
# This ensures fallback images in /static/ are moved to /staticfiles/ for Whitenoise
RUN python manage.py collectstatic --no-input

# Expose the port (Render will use this)
EXPOSE 8000

# --- THE FIX: COMBINED COMMAND ---
# This runs migrations FIRST, then starts the server. 
# If migrate fails, the logs will tell us why (likely a DB connection string issue).
CMD ["sh", "-c", "python manage.py migrate --no-input && gunicorn store.wsgi:application --bind 0.0.0.0:8000"]