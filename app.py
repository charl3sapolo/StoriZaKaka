"""
WSGI entry point for Render deployment.
This file is a simple wrapper around the Django WSGI application.
"""

import os
import sys

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'movierecommender.settings.production')

# Import the Django WSGI application
from django.core.wsgi import get_wsgi_application

# Create the WSGI application
application = get_wsgi_application()
