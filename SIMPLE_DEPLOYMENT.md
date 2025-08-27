# Simple Deployment Guide for KakaFlix on Render

This guide provides a straightforward approach to deploy KakaFlix on Render using Python (without Docker).

## Quick Start

1. **Log in to Render** and go to your dashboard
2. Click on the **"New +"** button and select **"Web Service"**
3. Connect your repository
4. Configure the service:
   - Name: `kakaflix`
   - Environment: Python
   - Region: Choose a region close to your users
   - Branch: `main` (or your default branch)
   - Build Command: `pip install -r requirements-simple.txt && python manage.py collectstatic --noinput`
   - Start Command: `gunicorn movierecommender.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120`
   - Select the Free plan
5. Add the following environment variables:
   - `DJANGO_SETTINGS_MODULE=movierecommender.settings.production`
   - `SECRET_KEY=your-secret-key`
   - `ALLOWED_HOSTS=.onrender.com`
   - `CSRF_TRUSTED_ORIGINS=https://*.onrender.com`
   - `DEBUG=False`
6. Click **"Create Web Service"**

## Database Setup

1. In your Render dashboard, click **"New +"** and select **"PostgreSQL"**
2. Configure your database:
   - Name: `kakaflix-db`
   - PostgreSQL Version: 14 or higher
   - Select the Free plan
3. Click **"Create Database"**
4. Once created, copy the "Internal Database URL" 
5. Go back to your web service and add this environment variable:
   - `DATABASE_URL=your-internal-database-url`

## Post-Deployment Steps

After successful deployment, you need to:

1. **Run Migrations**
   - Go to your web service dashboard
   - Click on the "Shell" tab
   - Run: `python manage.py migrate`

2. **Create a Superuser**
   - In the same shell, run:
   - `python manage.py createsuperuser`

3. **Verify Deployment**
   - Visit your application URL (provided by Render)
   - Log in with your superuser credentials

## Troubleshooting

If you encounter issues:

1. **Check Logs**: Go to your web service dashboard and click on the "Logs" tab
2. **Verify Environment Variables**: Make sure all required variables are set correctly
3. **Check Build Errors**: Look for any errors in the build process

## Common Issues and Solutions

1. **Static Files Not Loading**
   - Make sure `STATIC_URL` and `STATIC_ROOT` are set correctly
   - Verify that `whitenoise` is in your `MIDDLEWARE` settings

2. **Database Connection Issues**
   - Check that the `DATABASE_URL` is correct
   - Make sure the database is running and accessible

3. **Module Not Found Errors**
   - Ensure all required packages are in `requirements-simple.txt`
   - Try adding the missing package and redeploying

4. **WSGI Application Not Found**
   - Verify that the start command is pointing to the correct WSGI application
   - Check that `movierecommender.wsgi` exists and is correctly configured

## Updating Your Application

To update your application:

1. Push changes to your repository
2. Render will automatically detect changes and redeploy

For database migrations after code changes:

1. Access the web service shell
2. Run `python manage.py migrate`
