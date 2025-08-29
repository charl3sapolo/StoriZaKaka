#!/bin/bash
# Make sure pip and wheel are up-to-date
python -m pip install --upgrade pip setuptools wheel

# Ensure gunicorn is installed in runtime
python -m pip install gunicorn==21.2.0

# Run the Django app
python -m gunicorn movierecommender.wsgi:application --bind 0.0.0.0:$PORT
