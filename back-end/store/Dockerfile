FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the requirements from the store folder
COPY back-end/store/requirements.txt . 
RUN pip install --no-cache-dir -r requirements.txt

# Copy everything from back-end into /app
COPY back-end/ .

# --- THE FIX ---
# Change directory to where manage.py actually lives
WORKDIR /app/store

EXPOSE 10000

# Now 'python manage.py' will work because we are in /app/store
CMD ["sh", "-c", "python manage.py collectstatic --no-input && python manage.py migrate && gunicorn store.wsgi:application --bind 0.0.0.0:10000 --timeout 120 --workers 3"]