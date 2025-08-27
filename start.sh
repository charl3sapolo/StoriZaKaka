#!/bin/bash
set -e

# Collect static files
python manage.py collectstatic --noinput

# Apply database migrations
python manage.py migrate

# Start Gunicorn processes
echo "Starting Gunicorn with movierecommender.wsgi:application"
exec gunicorn movierecommender.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120
