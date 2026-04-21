#!/bin/sh

# 1. Exit immediately if a command exits with a non-zero status
set -e

# 2. Collect static files (Required for WhiteNoise on Render)
echo "Collecting static files..."
python manage.py collectstatic --noinput

# 3. Apply database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# 4. Start the server
echo "Starting server..."
exec "$@"