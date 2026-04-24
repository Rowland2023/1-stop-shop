rm entrypoint.sh
# Paste the contents fresh from your editor to ensure no hidden Windows characters
cat << 'EOF' > entrypoint.sh
#!/bin/bash
set -e
echo "Running migrations..."
python manage.py migrate --noinput
echo "Collecting static files..."
python manage.py collectstatic --noinput
echo "Starting server..."
exec "$@"
EOF