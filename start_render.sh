#!/bin/bash
# Simple script to start the application on Render

# Print debugging information
echo "Starting application on Render"
echo "DJANGO_SETTINGS_MODULE: $DJANGO_SETTINGS_MODULE"
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Start Gunicorn
echo "Starting Gunicorn..."
gunicorn movierecommender.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120
