AUTH_USER_MODEL = 'core.User'"""
Development settings for Movie Recommender project.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# Development-specific apps
if DEBUG:
    INSTALLED_APPS += [
        'debug_toolbar',
    ]
    
    MIDDLEWARE += [
        'debug_toolbar.middleware.DebugToolbarMiddleware',
    ]
    
    INTERNAL_IPS = [
        '127.0.0.1',
        'localhost',
    ]

# Email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Disable HTTPS redirects in development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Logging for development
LOGGING['root']['level'] = 'DEBUG'
LOGGING['handlers']['console']['level'] = 'DEBUG'

SESSION_ENGINE = 'django.contrib.sessions.backends.db'
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
LOGIN_REDIRECT_URL = '/discover/'
ACCOUNT_SIGNUP_REDIRECT_URL = '/discover/'
ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION = True
SOCIALACCOUNT_LOGIN_ON_GET = True