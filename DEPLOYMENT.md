# Deploying KakaFlix to Render

This guide provides step-by-step instructions for deploying KakaFlix to Render using Docker.

## Prerequisites

1. A Render account (sign up at [render.com](https://render.com) if you don't have one)
2. Your project code in a Git repository (GitHub, GitLab, etc.)
3. Your `.env` file with all necessary environment variables

## Deployment Options

### Option 1: Using Blueprint (Recommended)

Render Blueprints allow you to define your infrastructure as code using a `render.yaml` file, which is already included in this repository.

1. **Log in to Render** and go to your dashboard
2. Click on the **"New +"** button and select **"Blueprint"**
3. Connect your repository that contains this project
4. Render will automatically detect the `render.yaml` file and set up:
   - Web service (Docker-based Django application)
   - PostgreSQL database
   - Redis instance
5. Review the configuration and click **"Apply"**
6. Render will create all services and start the deployment process

### Option 2: Manual Setup

If you prefer to set up services manually:

#### 1. Create a PostgreSQL Database

1. In your Render dashboard, click **"New +"** and select **"PostgreSQL"**
2. Configure your database:
   - Name: `kakaflix-db`
   - PostgreSQL Version: 14 or higher
   - Select appropriate region and plan
3. Click **"Create Database"**
4. Once created, note the database connection details (internal URL)

#### 2. Create a Redis Instance

1. In your Render dashboard, click **"New +"** and select **"Redis"**
2. Configure your Redis instance:
   - Name: `kakaflix-redis`
   - Select appropriate region and plan
3. Click **"Create Redis"**
4. Once created, note the Redis connection URL

#### 3. Create a Web Service

1. In your Render dashboard, click **"New +"** and select **"Web Service"**
2. Connect your repository
3. Configure the service:
   - Name: `kakaflix`
   - Environment: Docker
   - Region: Choose the same region as your database
4. Add environment variables:
   - `DJANGO_SETTINGS_MODULE=movierecommender.settings.production`
   - `DATABASE_URL` (use the internal URL from your PostgreSQL database)
   - `REDIS_URL` (use the URL from your Redis instance)
   - `SECRET_KEY` (a secure random string)
   - `ALLOWED_HOSTS=.onrender.com`
   - `CSRF_TRUSTED_ORIGINS=https://*.onrender.com`
   - Add all other variables from your `.env` file
5. Click **"Create Web Service"**

## Docker Deployment Details

The application uses Docker for deployment, which provides several benefits:

1. **Consistent Environment**: The same environment is used for development and production
2. **Dependency Management**: All system and Python dependencies are installed automatically
3. **Isolation**: The application runs in an isolated container
4. **Performance**: The Docker image is optimized for performance

The Dockerfile:
- Uses Python 3.11 slim image as a base
- Installs system dependencies required for Pillow and other packages
- Sets up the Python environment
- Collects static files
- Runs the application using Gunicorn

## Post-Deployment Steps

After successful deployment, you need to:

### 1. Run Migrations

Access the web service shell in the Render dashboard and run:

```bash
python manage.py migrate
```

### 2. Create a Superuser

In the same shell, create an admin user:

```bash
python manage.py createsuperuser
```

### 3. Verify Deployment

Visit your application URL (provided by Render) to ensure everything is working correctly.

## Environment Variables Reference

Here's a list of all required environment variables:

```
# Django Settings
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=.onrender.com
CSRF_TRUSTED_ORIGINS=https://*.onrender.com
DEBUG=False
DJANGO_SETTINGS_MODULE=movierecommender.settings.production

# Database (provided by Render)
DATABASE_URL=postgres://...

# Redis (provided by Render)
REDIS_URL=redis://...

# External APIs
TMDB_API_KEY=your-tmdb-api-key
IMDB_API_KEY=your-imdb-api-key

# Google OAuth (if used)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

## Troubleshooting

If you encounter issues during deployment:

1. **Check Logs**: Render provides detailed logs for each service
2. **Verify Environment Variables**: Ensure all required variables are set correctly
3. **Database Connection**: Confirm the database URL is correct and accessible
4. **Static Files**: If static files are missing, check the collectstatic command output
5. **Docker Build Issues**: Check the build logs for any errors related to Docker

## Maintenance

To update your application:

1. Push changes to your repository
2. Render will automatically detect changes and redeploy

For database migrations after code changes:

1. Access the web service shell
2. Run `python manage.py migrate`

## Support

If you need help with Render-specific issues, refer to their [documentation](https://render.com/docs) or contact their support team.