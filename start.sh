#!/bin/bash
# Upgrade pip, setuptools, wheel
python -m pip install --upgrade pip setuptools wheel

# Install all dependencies using precompiled binaries to avoid Pillow build errors
python -m pip install --only-binary :all: -r requirements.txt

# Start the Django app with Gunicorn
python -m gunicorn movierecommender.wsgi:application --bind 0.0.0.0:$PORT
