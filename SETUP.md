# 🎬 Movie Recommender - Setup Guide

Welcome to the setup guide for the Movie Recommender application! This document will guide you through the installation and configuration process to get the application up and running smoothly.

## Overview

The Movie Recommender is a sophisticated, responsive web application that delivers personalized movie suggestions through intelligent filtering and user interaction. Built with Django 5.x and MongoDB, it features multilingual support, dynamic theming, and an engaging user experience.

## 🌟 Features

### Core Functionality
- **Intelligent Recommendations**: Hybrid collaborative and content-based filtering.
- **Advanced Search**: Full-text search with filters for genres, years, and ratings.
- **Multilingual Support**: Interface available in English and Swahili.
- **Dynamic Theming**: Light, dark, and auto themes.
- **User Profiles**: Personalized preferences and watch history.
- **Local Content**: Focus on Tanzanian and East African cinema.

### Technical Features
- **MongoDB Integration**: Flexible schema for movie data and analytics.
- **Responsive Design**: Mobile-first approach using CSS Grid and Flexbox.
- **Performance Optimized**: Load times under 3 seconds with lazy loading.
- **Accessibility**: Compliant with WCAG 2.1 AA standards.
- **Internationalization**: Utilizes Django's i18n framework.
- **Security**: CSRF protection and secure authentication.

## 🚀 Quick Start

### Prerequisites
Before you begin, ensure you have the following installed:
- Python 3.9+
- MongoDB 4.4+
- Redis (optional, for caching)

### Installation Steps

1. **Clone the Repository**
   - Open your terminal and run:
     ```bash
     git clone https://github.com/yourusername/movie-recommender.git
     cd movie-recommender
     ```

2. **Create a Virtual Environment**
   - Set up a Python virtual environment:
     ```bash
     python -m venv venv
     ```
   - Activate the virtual environment:
     - On macOS/Linux:
       ```bash
       source venv/bin/activate
       ```
     - On Windows:
       ```bash
       venv\Scripts\activate
       ```

3. **Install Dependencies**
   - Install the required packages:
     ```bash
     pip install -r requirements/development.txt
     ```

4. **Set Up Environment Variables**
   - Create a copy of the example environment file:
     ```bash
     cp env.example .env
     ```
   - Open `.env` and configure your environment variables as needed.

5. **Set Up MongoDB**
   - Start the MongoDB service.
   - Create a new database named `movierecommender`.

6. **Run Migrations**
   - Apply database migrations:
     ```bash
     python manage.py makemigrations
     python manage.py migrate
     ```

7. **Create a Superuser**
   - Create an admin account to manage the application:
     ```bash
     python manage.py createsuperuser
     ```

8. **Run the Development Server**
   - Start the server:
     ```bash
     python manage.py runserver
     ```
   - Access the application at `http://localhost:8000`.

## 📁 Project Structure

```
movierecommender/
├── apps/                    # Django applications
│   ├── core/                # Main models and views
│   ├── recommendations/     # Recommendation engine
│   ├── authentication/      # User management
│   └── api/                 # API endpoints
├── templates/               # HTML templates
├── static/                  # CSS, JS, images
├── locale/                  # Translation files
├── utils/                   # Project utilities
├── tests/                   # Test suites
└── docs/                    # Documentation
```

## 🗄 Database Schema

### Core Collections
- **Users**: User profiles, preferences, watch history.
- **Movies**: Movie metadata, ratings, cast/crew.
- **Genres**: Genre information with multilingual support.
- **Recommendation Sessions**: User recommendation history.

### MongoDB Analytics
- **Movie Analytics**: Complex queries and similarity scores.
- **User Preferences**: Behavioral patterns and preferences.

## 🎯 Usage

### For Users
1. **Browse Movies**: Explore the catalog with advanced filters.
2. **Get Recommendations**: Receive personalized movie suggestions.
3. **Rate Movies**: Rate watched movies to improve recommendations.
4. **Customize Profile**: Set preferences for language, theme, and content rating.
5. **Track History**: View your watch history and recommendation sessions.

### For Administrators
1. **Manage Content**: Add/edit movies, genres, and user data.
2. **Monitor Analytics**: Track user engagement and recommendation accuracy.
3. **Configure Settings**: Manage site settings and user preferences.

## 🔧 Configuration

### Environment Variables
```bash
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
MONGODB_URI=mongodb://localhost:27017/movierecommender
MONGODB_NAME=movierecommender

# External APIs
TMDB_API_KEY=your-tmdb-api-key
IMDB_API_KEY=your-imdb-api-key

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Settings Files
- **`settings/base.py`**: Common settings.
- **`settings/development.py`**: Development configuration.
- **`settings/production.py`**: Production configuration.

## 🧪 Testing

To run the test suite, use the following commands:

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.core
python manage.py test apps.recommendations
```

## 🚀 Deployment

### Production Setup
1. **Set environment variables** in your production environment.
2. **Collect static files**:
   ```bash
   python manage.py collectstatic
   ```
3. **Set up a web server** (Nginx + Gunicorn):
   ```bash
   gunicorn movierecommender.wsgi:application
   ```

### Deployment Platforms
- **Railway**: Easy deployment with MongoDB Atlas.
- **Render**: Free tier available with PostgreSQL.
- **Heroku**: Traditional Django deployment.
- **DigitalOcean**: VPS deployment for full control.

## 📊 Performance

### Optimization Features
- **Database Indexing**: Optimized MongoDB queries.
- **Caching**: Redis-based session and query caching.
- **Static Files**: CDN-ready static file serving.
- **Lazy Loading**: Images and content loaded on demand.

### Performance Targets
- **Page Load**: < 3 seconds on 3G.
- **Time to Interactive**: < 5 seconds.

## 🔒 Security

### Security Features
- **CSRF Protection**: Built-in Django CSRF protection.
- **XSS Prevention**: Content Security Policy headers.
- **SQL Injection**: MongoDB parameterized queries.

### Best Practices
- Regular security updates.
- Input validation and sanitization.

## 🌍 Internationalization

### Supported Languages
- **English** (default).
- **Swahili** (Kiswahili).

### Adding New Languages
1. Create translation files in the `locale/` directory.
2. Add the language to the `LANGUAGES` setting.
3. Translate UI strings and content.

## 🤝 Contributing

### Development Workflow
1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Submit a pull request.

## 📈 Analytics & Monitoring

### User Analytics
- Recommendation accuracy tracking.
- User engagement metrics.

### Performance Monitoring
- Page load times.
- Database query performance.

## 🔮 Future Enhancements

### Planned Features
- **Social Features**: User reviews and ratings sharing.
- **Mobile App**: React Native companion app.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Django Community**: For the excellent web framework.
- **MongoDB**: For the flexible NoSQL database.

## 📞 Support

### Getting Help
- **Documentation**: Check the `/docs` folder.
- **Issues**: Report bugs on GitHub Issues.

---

**Made with ❤️ for the Tanzanian and global cinema community**
```

