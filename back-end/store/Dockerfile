FROM python:3.11-slim

ENV PYTHONUNBUFFERED 1
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Since your Docker Build Context is set to 'back-end/store',
# you need to copy from that folder into /app.
# If these files are inside 'back-end/store/', you might need to adjust paths:
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy the rest of the project
COPY . /app/

# Setup static files
RUN mkdir -p /app/media /app/staticfiles
RUN python manage.py collectstatic --no-input

# Copy and setup entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "store.wsgi:application", "--bind", "0.0.0.0:8000"]