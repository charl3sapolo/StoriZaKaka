"""
Development settings for Movie Recommender project.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,91d0e59d3dce.ngrok-free.app').split(',')

# Development-specific apps
if DEBUG:
    # INSTALLED_APPS += [
    #     'debug_toolbar',
    # ]
    
    # MIDDLEWARE += [
    #     'debug_toolbar.middleware.DebugToolbarMiddleware',
    # ]
    
    INTERNAL_IPS = [
        '127.0.0.1',
        'localhost',
    ]

# Email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Use SQLite for development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Disable HTTPS redirects in development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# CSRF settings for development (including ngrok)
CSRF_TRUSTED_ORIGINS = [
    'https://91d0e59d3dce.ngrok-free.app',
    'https://*.ngrok-free.app',
    'https://*.ngrok.io',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
]

# Logging for development
LOGGING['root']['level'] = 'DEBUG'
LOGGING['handlers']['console']['level'] = 'DEBUG'

SESSION_ENGINE = 'django.contrib.sessions.backends.db'
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
LOGIN_URL = '/accounts/login/'
LOGIN_REDIRECT_URL = '/discover/'
ACCOUNT_SIGNUP_REDIRECT_URL = '/discover/'
ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION = True
SOCIALACCOUNT_LOGIN_ON_GET = True

# Additional allauth settings for proper redirects
ACCOUNT_DEFAULT_HTTP_PROTOCOL = 'http'
ACCOUNT_LOGOUT_ON_GET = True
ACCOUNT_LOGOUT_REDIRECT_URL = '/'
SOCIALACCOUNT_AUTO_SIGNUP = True