# Use a slim version of Python for a smaller footprint
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install dependencies first (for caching)
COPY back-end/store/requirements.txt . 
RUN pip install --no-cache-dir -r requirements.txt

# 2. CRITICAL FIX: Use the trailing slash to copy CONTENTS, not the folder itself
# This puts manage.py directly into /app
COPY back-end/ ./

# 3. Expose Render's default port
EXPOSE 10000

# 4. Runtime execution
# Added --log-level debug to help us see if anything else pops up
CMD ["sh", "-c", "python manage.py collectstatic --no-input && python manage.py migrate && gunicorn store.wsgi:application --bind 0.0.0.0:10000 --timeout 120 --workers 3 --log-level debug"]