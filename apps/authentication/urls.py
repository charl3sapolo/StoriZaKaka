"""
URL patterns for the authentication app.
"""

from django.urls import path
from django.contrib.auth.views import LogoutView
from . import views

app_name = 'authentication'

urlpatterns = [
    # Authentication
    path('login/', views.CustomLoginView.as_view(), name='login'),
    path('register/', views.CustomRegisterView.as_view(), name='register'),
    path('logout/', views.logout_view, name='logout'),
    
    # Profile management
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('profile/preferences/', views.update_preferences, name='update_preferences'),
    path('profile/password/', views.change_password, name='change_password'),
    path('profile/delete/', views.delete_account, name='delete_account'),
    path('profile/export/', views.export_data, name='export_data'),
    
    # Password reset
    path('password-reset/', views.CustomPasswordResetView.as_view(), name='password_reset'),
    path('password-reset/done/', views.CustomPasswordResetDoneView.as_view(), name='password_reset_done'),
    path('password-reset/<uidb64>/<token>/', views.CustomPasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password-reset/complete/', views.CustomPasswordResetCompleteView.as_view(), name='password_reset_complete'),
    
    # Guest mode
    path('guest/', views.guest_mode, name='guest_mode'),
    
    # AJAX endpoints
    path('check-username/', views.check_username_availability, name='check_username'),
    path('check-email/', views.check_email_availability, name='check_email'),
] 