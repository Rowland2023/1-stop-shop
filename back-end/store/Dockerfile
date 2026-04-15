FROM python:3.11-slim

# Prevent Python from buffering stdout/stderr
ENV PYTHONUNBUFFERED 1
WORKDIR /app

# Install OS dependencies for Postgres
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose the port (Render uses 8000 by default for web services)
EXPOSE 8000

# THE CRITICAL CHANGE: Start the server directly without 'migrate'
CMD ["gunicorn", "store.wsgi:application", "--bind", "0.0.0.0:8000"]