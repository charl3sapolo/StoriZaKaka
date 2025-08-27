#!/bin/bash
# exit on error
set -o errexit

# Install system dependencies for Pillow
apt-get update && apt-get install -y --no-install-recommends \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libwebp-dev \
    zlib1g-dev \
    libopenjp2-7-dev \
    python3-dev

# Install Python dependencies
pip install --upgrade pip
pip install wheel
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --no-input

# Run migrations
python manage.py migrate