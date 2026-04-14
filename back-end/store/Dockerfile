# Optimized for Python 3.11 Slim
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies for PostgreSQL and Pillow
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Copy requirements from the specific subfolder relative to market-place/
COPY back-end/store/requirements.txt . 

# 2. Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copy the backend code into the container root
COPY back-end/ .

# 4. Port exposure for Render
EXPOSE 10000

# 5. Runtime execution: We move collectstatic here to prevent Build-Time failures.
# This ensures that even if models change, the build will finish and you can debug on-the-fly.
CMD ["sh", "-c", "python manage.py collectstatic --no-input && python manage.py migrate && gunicorn store.wsgi:application --bind 0.0.0.0:10000 --timeout 120 --workers 3"]