# Google OAuth Setup Guide

## 🚀 **Enhanced Authentication System**

Your MoviePicker application now has a modern, secure authentication system with Google OAuth integration and beautiful UI.

## 📋 **Features Implemented**

### **1. Modern UI Design**
- **Glass-morphism design** with backdrop blur effects
- **Floating label animations** for form inputs
- **Gradient buttons** with hover effects
- **Responsive design** for mobile and desktop
- **Google OAuth button** with official Google branding

### **2. Authentication Features**
- **Local registration/login** with email and password
- **Google OAuth integration** for seamless social login
- **Secure password hashing** using Django's built-in security
- **User data persistence** in PostgreSQL database
- **Session management** with proper redirects

### **3. Database Integration**
- **Custom User model** with extended fields (avatar, bio, etc.)
- **Social account linking** for Google OAuth users
- **Automatic user creation** from Google profile data
- **Data integrity** with database transactions

## 🔧 **Setup Instructions**

### **1. Environment Variables**
Add these to your `.env` file:

```env
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Database Configuration
DB_NAME=KakaFlix
DB_USER=moviepicker_user
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432

# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### **2. Google OAuth Setup**

#### **Step 1: Create Google OAuth Credentials**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://127.0.0.1:8000/accounts/google/login/callback/`
   - `http://localhost:8000/accounts/google/login/callback/`
7. Copy the Client ID and Client Secret

#### **Step 2: Update Environment Variables**
```env
GOOGLE_CLIENT_ID=your-actual-client-id
GOOGLE_CLIENT_SECRET=your-actual-client-secret
```

#### **Step 3: Run Setup Command**
```bash
python manage.py setup_google_oauth
```

### **3. Database Setup**
```bash
# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

### **4. Start Development Server**
```bash
python manage.py runserver
```

## 🎯 **Testing the Authentication System**

### **1. Test Local Registration**
1. Visit: `http://127.0.0.1:8000/accounts/signup/`
2. Fill in the registration form
3. Verify user is created in database
4. Check redirect to discover page

### **2. Test Local Login**
1. Visit: `http://127.0.0.1:8000/accounts/login/`
2. Enter credentials
3. Verify successful login
4. Check redirect to discover page

### **3. Test Google OAuth**
1. Visit: `http://127.0.0.1:8000/accounts/login/`
2. Click "Google" button
3. Complete Google OAuth flow
4. Verify user is created/authenticated
5. Check redirect to discover page

### **4. Test Protected Routes**
1. Try accessing `/discover/` without login
2. Should redirect to login page
3. Login and verify access to protected pages

## 🔍 **Database Verification**

### **Check User Creation**
```python
# In Django shell
python manage.py shell

from apps.core.models import User
from allauth.socialaccount.models import SocialAccount

# Check local users
User.objects.filter(is_active=True).count()

# Check Google OAuth users
SocialAccount.objects.filter(provider='google').count()

# Check specific user data
user = User.objects.first()
print(f"Username: {user.username}")
print(f"Email: {user.email}")
print(f"First Name: {user.first_name}")
print(f"Last Name: {user.last_name}")
print(f"Avatar: {user.avatar}")
```

## 🎨 **UI Features**

### **Login Page (`/accounts/login/`)**
- Modern glass-morphism design
- Floating label animations
- Google OAuth integration
- Error handling with styled alerts
- Responsive mobile design

### **Register Page (`/accounts/signup/`)**
- Matching design with login page
- Form validation with real-time feedback
- Google OAuth option
- Password confirmation
- Username generation

### **Navigation Updates**
- Dynamic header with login/logout links
- User-specific navigation items
- Proper authentication status detection

## 🔒 **Security Features**

### **1. Password Security**
- Django's built-in password hashing
- Password validation rules
- Secure session management

### **2. OAuth Security**
- Google OAuth 2.0 implementation
- Secure token handling
- User data validation

### **3. CSRF Protection**
- All forms include CSRF tokens
- Secure form submission

### **4. Session Security**
- Secure session configuration
- Proper logout handling
- Redirect security

## 🐛 **Troubleshooting**

### **Common Issues**

#### **1. Google OAuth Not Working**
- Check environment variables are set correctly
- Verify redirect URIs in Google Console
- Run `python manage.py setup_google_oauth`
- Check Django admin for SocialApp configuration

#### **2. Database Connection Issues**
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Run `python manage.py migrate`

#### **3. Static Files Not Loading**
- Run `python manage.py collectstatic`
- Check `STATIC_URL` and `STATIC_ROOT` settings

#### **4. User Data Not Saving**
- Check custom adapters are configured
- Verify database migrations
- Check for form validation errors

### **Debug Commands**
```bash
# Check Google OAuth setup
python manage.py setup_google_oauth

# Check database migrations
python manage.py showmigrations

# Check static files
python manage.py collectstatic --dry-run

# Check environment variables
python manage.py shell -c "from decouple import config; print('GOOGLE_CLIENT_ID:', config('GOOGLE_CLIENT_ID', default='NOT_SET'))"
```

## 📱 **Mobile Responsiveness**

The authentication pages are fully responsive:
- **Mobile**: Single column layout with touch-friendly buttons
- **Tablet**: Optimized spacing and typography
- **Desktop**: Full-width layout with enhanced hover effects

## 🎯 **Next Steps**

1. **Test all authentication flows**
2. **Verify user data persistence**
3. **Test protected route access**
4. **Check mobile responsiveness**
5. **Monitor server logs for any errors**

## 📞 **Support**

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Check Django admin for proper configuration
4. Review server logs for error messages

---

**🎉 Your authentication system is now ready with modern UI and Google OAuth integration!** 