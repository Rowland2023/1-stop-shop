#!/usr/bin/env bash
set -e

echo "Running collectstatic..."
python manage.py collectstatic --noinput

echo "Running migrations..."
# If this line fails, it will now print an error before exiting
python manage.py migrate --noinput || { echo "MIGRATION FAILED - Check your DB credentials/schema"; exit 1; }

echo "Starting Gunicorn..."
exec "$@"