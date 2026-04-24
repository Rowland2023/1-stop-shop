FROM python:3.11-slim

# Prevent Python from buffering stdout/stderr
ENV PYTHONUNBUFFERED 1
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from root and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project to /app
COPY . .

# --- STATIC & MEDIA PREPARATION ---
RUN mkdir -p /app/media /app/staticfiles

# Set dummy environment variables for build-time
ENV SECRET_KEY=build-time-key-only
ENV DEBUG=False

# Collect static files
# Note: Ensure manage.py is in the root or adjust the path
RUN python manage.py collectstatic --no-input

# --- ENTRYPOINT CONFIGURATION ---
# entrypoint.sh is in root, copy it explicitly to /app/entrypoint.sh
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose the port
EXPOSE 8000

# Use the entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]

# The CMD is passed to the entrypoint script
CMD ["gunicorn", "store.wsgi:application", "--bind", "0.0.0.0:8000"]