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
# Note: Ensure manage.py is in the root (/app/). 
# If manage.py is inside a subdirectory (e.g., /app/store/), 
# you must adjust the path here and in the ENTRYPOINT below.
RUN mkdir -p /app/media /app/staticfiles
RUN python manage.py collectstatic --no-input

# Copy and setup entrypoint at the location called by ENTRYPOINT
# I have updated this to align with your ENTRYPOINT path
COPY entrypoint.sh /app/store/entrypoint.sh
RUN sed -i 's/\r$//' /app/store/entrypoint.sh && chmod +x /app/store/entrypoint.sh

EXPOSE 8000

# Now the paths are perfectly aligned
ENTRYPOINT ["/bin/sh", "/app/store/entrypoint.sh"]

# Ensure the CMD is explicitly passing arguments
CMD ["gunicorn", "store.wsgi:application", "--bind", "0.0.0.0:8000"]