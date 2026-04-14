FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Install system dependencies for Pillow and Postgres
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY back-end/store/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY back-end/store/ .
RUN mkdir -p /app/staticfiles

# Note: collectstatic may fail here if DATABASE_URL isn't present during build.
# It is often safer to run collectstatic in the CMD or via a separate build step.
RUN python manage.py collectstatic --no-input --no-post-process

CMD python manage.py migrate && gunicorn store.wsgi:application --bind 0.0.0.0:10000 --timeout 120 --workers 3 --log-level debug