#!/usr/bin/env bash
set -e

echo "--- Entrypoint started ---" 2>&1

echo "Collecting static files..." 2>&1
python manage.py collectstatic --noinput 2>&1

echo "Running migrations..." 2>&1
# We capture stderr (2>&1) so any database error shows up in your Render logs
python manage.py migrate --noinput 2>&1

echo "Starting Gunicorn..." 2>&1
exec gunicorn store.wsgi:application --bind 0.0.0.0:8000 2>&1