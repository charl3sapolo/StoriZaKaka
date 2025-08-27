#!/bin/bash
# Exit on error
set -o errexit

echo "Starting KakaFlix application..."
echo "DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Start Gunicorn with explicit WSGI application
echo "Starting Gunicorn..."
exec gunicorn movierecommender.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120
