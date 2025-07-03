# 🎬 Movie Recommender - Advanced Movie Recommendation Platform

A sophisticated, responsive movie recommendation web application that delivers personalized movie suggestions through intelligent filtering and user interaction. Built with Django 5.x and MongoDB, featuring multilingual support (English & Swahili), dynamic theming, and engaging user experience.

## 🌟 Features

### 🎯 Core Functionality
- **Intelligent Recommendations**: Hybrid collaborative + content-based filtering
- **Advanced Search**: Full-text search with filters for genres, years, ratings
- **Multilingual Support**: English and Swahili interface
- **Dynamic Theming**: Light, dark, and auto themes
- **User Profiles**: Personalized preferences and watch history
- **Local Content**: Special focus on Tanzanian and East African cinema

### 🛠 Technical Features
- **MongoDB Integration**: Flexible schema for movie data and analytics
- **Responsive Design**: Mobile-first approach with CSS Grid/Flexbox
- **Performance Optimized**: Sub-3 second load times, lazy loading
- **Accessibility**: WCAG 2.1 AA compliant
- **Internationalization**: Django i18n framework
- **Security**: CSRF protection, secure authentication

### 🎨 User Experience
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Personalization**: User preferences and recommendation history
- **Guest Mode**: Try recommendations without registration
- **Real-time Search**: Instant search suggestions
- **Mobile Optimized**: Perfect experience on all devices

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- MongoDB 4.4+
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/movie-recommender.git
   cd movie-recommender
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements/development.txt
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Set up MongoDB**
   ```bash
   # Start MongoDB service
   # Create database: movierecommender
   ```

6. **Run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

7. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

8. **Run development server**
   ```bash
   python manage.py runserver
   ```

9. **Visit the application**
   ```
   http://localhost:8000
   ```

## 📁 Project Structure

```
movierecommender/
├── apps/                    # Django applications
│   ├── core/               # Main models and views
│   ├── recommendations/    # Recommendation engine
│   ├── authentication/     # User management
│   └── api/               # API endpoints
├── templates/              # HTML templates
├── static/                 # CSS, JS, images
├── locale/                 # Translation files
├── utils/                  # Project utilities
├── tests/                  # Test suites
└── docs/                   # Documentation
```

## 🗄 Database Schema

### Core Collections
- **Users**: User profiles, preferences, watch history
- **Movies**: Movie metadata, ratings, cast/crew
- **Genres**: Genre information with multilingual support
- **Recommendation Sessions**: User recommendation history

### MongoDB Analytics
- **Movie Analytics**: Complex queries and similarity scores
- **User Preferences**: Behavioral patterns and preferences

## 🎯 Usage

### For Users
1. **Browse Movies**: Explore the movie catalog with advanced filters
2. **Get Recommendations**: Receive personalized movie suggestions
3. **Rate Movies**: Rate watched movies to improve recommendations
4. **Customize Profile**: Set preferences for language, theme, content rating
5. **Track History**: View your watch history and recommendation sessions

### For Administrators
1. **Manage Content**: Add/edit movies, genres, and user data
2. **Monitor Analytics**: Track user engagement and recommendation accuracy
3. **Configure Settings**: Manage site settings and user preferences

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
- `settings/base.py`: Common settings
- `settings/development.py`: Development configuration
- `settings/production.py`: Production configuration

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.core
python manage.py test apps.recommendations

# Run with coverage
coverage run --source='.' manage.py test
coverage report
coverage html
```

## 🚀 Deployment

### Production Setup
1. **Set environment variables**
   ```bash
   DEBUG=False
   SECURE_SSL_REDIRECT=True
   ```

2. **Collect static files**
   ```bash
   python manage.py collectstatic
   ```

3. **Set up web server** (Nginx + Gunicorn)
   ```bash
   gunicorn movierecommender.wsgi:application
   ```

4. **Configure MongoDB Atlas** (recommended for production)

### Deployment Platforms
- **Railway**: Easy deployment with MongoDB Atlas
- **Render**: Free tier available with PostgreSQL
- **Heroku**: Traditional Django deployment
- **DigitalOcean**: VPS deployment with full control

## 📊 Performance

### Optimization Features
- **Database Indexing**: Optimized MongoDB queries
- **Caching**: Redis-based session and query caching
- **Static Files**: CDN-ready static file serving
- **Lazy Loading**: Images and content loaded on demand
- **Compression**: Gzip compression for faster loading

### Performance Targets
- **Page Load**: < 3 seconds on 3G
- **Time to Interactive**: < 5 seconds
- **Lighthouse Score**: > 90 across all metrics
- **Database Queries**: < 500ms average response time

## 🔒 Security

### Security Features
- **CSRF Protection**: Built-in Django CSRF protection
- **XSS Prevention**: Content Security Policy headers
- **SQL Injection**: MongoDB parameterized queries
- **Authentication**: Secure session management
- **HTTPS**: SSL/TLS encryption in production

### Best Practices
- Regular security updates
- Environment variable management
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure file upload handling

## 🌍 Internationalization

### Supported Languages
- **English** (default)
- **Swahili** (Kiswahili)

### Adding New Languages
1. Create translation files in `locale/`
2. Add language to `LANGUAGES` setting
3. Translate UI strings and content
4. Test RTL support if needed

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Style
- Follow PEP 8 for Python code
- Use Black for code formatting
- Write comprehensive docstrings
- Add type hints where appropriate

### Testing Guidelines
- Unit tests for all new functions
- Integration tests for API endpoints
- Frontend tests for user interactions
- Performance tests for critical paths

## 📈 Analytics & Monitoring

### User Analytics
- Recommendation accuracy tracking
- User engagement metrics
- Search query analysis
- Content popularity trends

### Performance Monitoring
- Page load times
- Database query performance
- Error rates and logging
- User satisfaction metrics

## 🔮 Future Enhancements

### Phase 2 Features
- **Social Features**: User reviews, ratings sharing
- **Advanced ML**: Deep learning recommendation models
- **Content Management**: Admin interface for local movies
- **Mobile App**: React Native companion app

### Phase 3 Features
- **Streaming Integration**: Netflix, Amazon Prime links
- **Community Features**: Discussion forums, movie clubs
- **Personalization**: AI-driven content curation
- **Monetization**: Premium features, affiliate marketing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Django Community**: For the excellent web framework
- **MongoDB**: For the flexible NoSQL database
- **TMDB API**: For movie data and metadata
- **Open Source Contributors**: For various libraries and tools

## 📞 Support

### Getting Help
- **Documentation**: Check the `/docs` folder
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team

### Community
- **Discord**: Join our community server
- **Twitter**: Follow for updates and announcements
- **Blog**: Read our development blog

---

**Made with ❤️ for the Tanzanian and global cinema community** 