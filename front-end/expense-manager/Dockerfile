# Dockerfile
FROM python:3.11-slim

# 1. Install system dependencies for PostgreSQL and Gunicorn
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# 3. Copy your project code
COPY . .

# 4. Set Production Environment Variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PORT 8000

# 5. The Runtime Command:
# - Collects static files for Nginx to serve
# - Runs migrations (fakes them if the tables exist to avoid 'DuplicateTable' error)
# - Starts the server using Gunicorn
CMD python manage.py collectstatic --noinput && \
    python manage.py migrate --fake-initial && \
    gunicorn --bind 0.0.0.0:$PORT store.wsgi:application