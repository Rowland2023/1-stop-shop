FROM python:3.11-slim

WORKDIR /app

# The path must be relative to the REPO ROOT because your context is "."
COPY back-end/store/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy everything from the store folder into the /app directory
COPY back-end/store/ .

# Ensure the module path for gunicorn is correct
# If 'store' is the folder with wsgi.py, this stays as is
CMD ["gunicorn", "store.wsgi:application", "--bind", "0.0.0.0:10000"]