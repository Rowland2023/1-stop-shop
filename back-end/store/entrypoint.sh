#!/bin/sh
set -e

echo "--- Entrypoint started ---"
python manage.py collectstatic --noinput
python manage.py migrate --noinput

echo "Starting Gunicorn..."
# Use python -m to run gunicorn directly from the current environment
exec python -m gunicorn store.wsgi:application --bind 0.0.0.0:8000