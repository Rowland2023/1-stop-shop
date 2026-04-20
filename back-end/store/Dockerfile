FROM python:3.11-slim

# Prevent Python from buffering stdout/stderr
ENV PYTHONUNBUFFERED 1
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# --- STATIC & MEDIA PREPARATION ---
RUN mkdir -p /app/media /app/staticfiles

# Set dummy environment variables for build-time
ENV SECRET_KEY=build-time-key-only
ENV DEBUG=False

# Collect static files
RUN python manage.py collectstatic --no-input

# --- ENTRYPOINT CONFIGURATION ---
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose the port
EXPOSE 8000

# Use the entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]

# The CMD is passed to the entrypoint script as "$@"
CMD ["gunicorn", "store.wsgi:application", "--bind", "0.0.0.0:8000"]