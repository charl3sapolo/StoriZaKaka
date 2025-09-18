# 🎬 KakaFlix - Movie Recommender

## Introduction

Welcome to **KakaFlix**! This web application offers a sophisticated experience for movie enthusiasts, delivering tailored movie suggestions based on user preferences and viewing history. Built on Django 4.2 and PostgreSQL, it supports both English and Swahili, ensuring accessibility for a diverse audience.

## Key Features

### User-Centric Functionality

- **Smart Recommendations**: Employs a hybrid approach combining collaborative and content-based methods for personalized suggestions.
- **Advanced Search Options**: Find movies effortlessly using filters for genres, release years, and ratings.
- **Multilingual Interface**: Enjoy a seamless experience in English or Swahili.
- **Dynamic Theming**: Choose between light, dark, and auto themes to suit your mood.
- **Personalized User Profiles**: Save preferences and track your viewing history.

### Technical Aspects

- **PostgreSQL Database**: Utilizes a relational database to manage movie-related data effectively.
- **Responsive Design**: Crafted with a mobile-first approach using CSS Grid and Flexbox for optimal viewing on all devices.
- **Performance Focused**: Engineered for quick load times, employing techniques like lazy loading.
- **Accessibility Standards**: Designed to meet WCAG 2.1 AA compliance.
- **Internationalization**: Built-in support for multiple languages using Django's i18n framework.

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Python 3.11 or higher
- PostgreSQL 13 or higher
- Redis (for caching)

### Installation Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/kakaflix.git
   cd kakaflix
   ```

2. **Create a Virtual Environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # Use venv\Scripts\activate on Windows
   ```

3. **Install Required Packages**

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**

   ```bash
   cp env.example .env
   # Open .env and set your configurations
   ```

5. **Set Up PostgreSQL**

   - Start your PostgreSQL service.
   - Create a database named `kakaflix`.

6. **Run Migrations**

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

7. **Create an Admin User**

   ```bash
   python manage.py createsuperuser
   ```

8. **Launch the Development Server**

   ```bash
   python manage.py runserver
   ```

9. **Access Your Application**
   Open your browser and navigate to `http://localhost:8000`.

## Project Structure

```
kakaflix/
├── apps/                    # Contains Django apps
│   ├── core/                # Main application logic
│   ├── recommendations/     # Recommendation engine logic
│   ├── authentication/      # User login and management
│   └── api/                 # API endpoints for data access
├── templates/               # HTML templates for rendering
├── static/                  # Static files (CSS, JS, images)
├── locale/                  # Localization files
├── movierecommender/        # Project settings
└── requirements/            # Dependency files
```

## Testing Your Application

To run the complete test suite, use:

```bash
python manage.py test
```

## Deployment Instructions

### Deploying to Render

1. **Create a Render Account**

   - Sign up at [render.com](https://render.com) if you don't have an account

2. **Connect Your Repository**

   - Connect your GitHub/GitLab repository to Render

3. **Set Up Environment Variables**

   - Copy all variables from your `.env` file to Render's environment variables section
   - Make sure to set `DJANGO_SETTINGS_MODULE=movierecommender.settings.production`

4. **Deploy Using render.yaml**

   - This repository includes a `render.yaml` file that defines:
     - Web service (Django application)
     - PostgreSQL database
     - Redis instance

5. **Deploy from Dashboard**

   - Click "New" → "Blueprint"
   - Select your repository
   - Render will automatically detect the `render.yaml` file and set up services

6. **Manual Deployment Alternative**

   - If not using the Blueprint feature:
     - Create a new Web Service
     - Set build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
     - Set start command: `gunicorn movierecommender.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 120`
     - Add all environment variables from your `.env` file

7. **Database Setup**

   - Create a PostgreSQL database in Render
   - Connect it to your web service by setting the database environment variables

8. **Run Migrations**

   - After deployment, run migrations using Render's shell:
     ```bash
     python manage.py migrate
     ```

9. **Create Superuser**

   - Create an admin user:
     ```bash
     python manage.py createsuperuser
     ```

10. **Access Your Deployed Application**
    - Your app will be available at the URL provided by Render

### Important Production Settings

- Make sure `DEBUG=False` in production
- Set proper `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS`
- Use secure cookies with `SESSION_COOKIE_SECURE=True` and `CSRF_COOKIE_SECURE=True`
- Enable HTTPS redirect with `SECURE_SSL_REDIRECT=True`

## Security Considerations

This application incorporates essential security features, including CSRF protection and secure session handling. Regularly update your dependencies to maintain security.

## Support and Contribution

For assistance, please refer to the documentation or raise issues via GitHub. Contributions are welcome!

### How to Contribute

1. Fork the repository.
2. Create a new branch for your feature.
3. Implement your changes and ensure tests pass.
4. Submit a pull request for review.

---

**Created with passion for the Tanzanian and global cinema community!**

### Render blueprint details

- This repo includes a `render.yaml` at the repository root. Use Render → New → Blueprint to provision the service.
- Build command executed on Render:
  ```
  pip install -r StoriZaKaka/requirements.txt && python StoriZaKaka/manage.py collectstatic --noinput
  ```
- Start command executed on Render:
  ```
  python -m gunicorn movierecommender.wsgi:application --chdir StoriZaKaka --bind 0.0.0.0:$PORT --workers 3
  ```
- Required environment variables:
  - `DJANGO_SETTINGS_MODULE=movierecommender.settings.production`
  - `SECRET_KEY` (set a strong value or use Render auto-generate)
  - `DEBUG=False`
  - `ALLOWED_HOSTS` (e.g. `storizakaka.onrender.com`)
  - `CSRF_TRUSTED_ORIGINS` (e.g. `https://storizakaka.onrender.com`)
  - `DATABASE_URL` (from a Render PostgreSQL instance)
  - `REDIS_URL` (optional if using Redis cache)
  - `STATIC_URL=/static/`, `STATIC_ROOT=staticfiles` (defaults already set)
  - `MEDIA_URL=/media/`, `MEDIA_ROOT=media`

After the first deploy, run migrations from the Render Shell:

```
python manage.py migrate --noinput
```
