FROM python:3.11-slim

# Prevent Python from buffering stdout/stderr (better logging)
ENV PYTHONUNBUFFERED 1
WORKDIR /app

# Install system dependencies for Postgres
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the port Django will run on
EXPOSE 8000

# THE FIX: Start Gunicorn directly. 
# This skips 'python manage.py migrate' which is causing the crash.
CMD ["gunicorn", "store.wsgi:application", "--bind", "0.0.0.0:8000"]