"""
Gunicorn configuration file
"""
import multiprocessing

# Bind to this socket
bind = "0.0.0.0:$PORT"

# Number of worker processes
workers = multiprocessing.cpu_count() * 2 + 1
workers = 3  # Override for Render's free tier

# Worker class
worker_class = 'sync'

# Timeout in seconds
timeout = 120

# The path to the application
wsgi_app = 'movierecommender.wsgi:application'

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'
