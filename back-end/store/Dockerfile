FROM python:3.11-slim

ENV PYTHONUNBUFFERED 1
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy the rest of the project
COPY . /app/

# Setup static files
RUN mkdir -p /app/media /app/staticfiles
RUN python manage.py collectstatic --no-input

# Copy and setup entrypoint
COPY entrypoint.sh /app/entrypoint.sh
# 1. Force the file to be LF (Linux) format (removes potential Windows \r characters)
# 2. Make it executable
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 8000
# Bypass the shebang by calling the shell explicitly
ENTRYPOINT ["/bin/sh", "/app/store/entrypoint.sh"]

# Ensure the CMD is explicitly passing arguments
CMD ["gunicorn", "store.wsgi:application", "--bind", "0.0.0.0:8000"]