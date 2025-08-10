"""
Authentication views for the Movie Recommender application.
"""

from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from django.contrib.auth.views import (
    LoginView, PasswordResetView, PasswordResetDoneView,
    PasswordResetConfirmView, PasswordResetCompleteView
)
from django.urls import reverse_lazy
from django.views.generic import CreateView, UpdateView, TemplateView
from django.utils.translation import gettext as _
from django.http import JsonResponse

from .forms import (
    CustomUserCreationForm, CustomAuthenticationForm, UserProfileForm,
    UserPreferencesForm, PasswordChangeForm
)


class CustomLoginView(LoginView):
    """Custom login view."""
    
    form_class = CustomAuthenticationForm
    template_name = 'account/login.html'
    redirect_authenticated_user = True
    
    def get_success_url(self):
        """Redirect to discover page after successful login."""
        return reverse_lazy('discover')
    
    def dispatch(self, request, *args, **kwargs):
        """Redirect authenticated users to discover page."""
        if request.user.is_authenticated:
            return redirect('discover')
        return super().dispatch(request, *args, **kwargs)
    
    def form_valid(self, form):
        """Handle successful login."""
        remember_me = form.cleaned_data.get('remember_me')
        if not remember_me:
            self.request.session.set_expiry(0)
        
        messages.success(self.request, _('Welcome back!'))
        return super().form_valid(form)


class CustomRegisterView(CreateView):
    """Custom registration view."""
    
    form_class = CustomUserCreationForm
    template_name = 'account/signup.html'
    success_url = reverse_lazy('discover')
    
    def dispatch(self, request, *args, **kwargs):
        """Redirect authenticated users."""
        if request.user.is_authenticated:
            return redirect('discover')
        return super().dispatch(request, *args, **kwargs)
    
    def form_valid(self, form):
        """Handle successful registration."""
        response = super().form_valid(form)
        
        # Log the user in
        username = form.cleaned_data.get('username')
        password = form.cleaned_data.get('password1')
        user = authenticate(username=username, password=password)
        login(self.request, user)
        
        messages.success(self.request, _('Account created successfully! Welcome to KakaFlix.'))
        return response


@login_required
def logout_view(request):
    """Custom logout view."""
    logout(request)
    messages.success(request, _('You have been logged out successfully.'))
    return redirect('core:home')


class ProfileView(LoginRequiredMixin, TemplateView):
    """User profile view."""
    
    template_name = 'pages/profile.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['user'] = self.request.user
        context['profile_form'] = UserProfileForm(instance=self.request.user)
        context['preferences_form'] = UserPreferencesForm(instance=self.request.user)
        context['password_form'] = PasswordChangeForm(user=self.request.user)
        return context


@login_required
def update_profile(request):
    """Update user profile."""
    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, _('Profile updated successfully!'))
            return redirect('auth:profile')
        else:
            messages.error(request, _('Please correct the errors below.'))
    else:
        form = UserProfileForm(instance=request.user)
    
    return render(request, 'auth/profile.html', {
        'profile_form': form,
        'preferences_form': UserPreferencesForm(instance=request.user),
        'password_form': PasswordChangeForm(user=request.user)
    })


@login_required
def update_preferences(request):
    """Update user preferences."""
    if request.method == 'POST':
        form = UserPreferencesForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, _('Preferences updated successfully!'))
            return redirect('auth:profile')
        else:
            messages.error(request, _('Please correct the errors below.'))
    else:
        form = UserPreferencesForm(instance=request.user)
    
    return render(request, 'auth/profile.html', {
        'profile_form': UserProfileForm(instance=request.user),
        'preferences_form': form,
        'password_form': PasswordChangeForm(user=request.user)
    })


@login_required
def change_password(request):
    """Change user password."""
    if request.method == 'POST':
        form = PasswordChangeForm(request.user, request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, _('Password changed successfully!'))
            return redirect('auth:profile')
        else:
            messages.error(request, _('Please correct the errors below.'))
    else:
        form = PasswordChangeForm(user=request.user)
    
    return render(request, 'auth/profile.html', {
        'profile_form': UserProfileForm(instance=request.user),
        'preferences_form': UserPreferencesForm(instance=request.user),
        'password_form': form
    })


class CustomPasswordResetView(PasswordResetView):
    """Custom password reset view."""
    
    template_name = 'account/password_reset.html'
    email_template_name = 'account/password_reset_email.html'
    subject_template_name = 'account/password_reset_subject.txt'
    success_url = reverse_lazy('authentication:password_reset_done')


class CustomPasswordResetDoneView(PasswordResetDoneView):
    """Custom password reset done view."""
    
    template_name = 'account/password_reset_done.html'


class CustomPasswordResetConfirmView(PasswordResetConfirmView):
    """Custom password reset confirm view."""
    
    template_name = 'account/password_reset_confirm.html'
    success_url = reverse_lazy('authentication:password_reset_complete')


class CustomPasswordResetCompleteView(PasswordResetCompleteView):
    """Custom password reset complete view."""
    
    template_name = 'account/password_reset_complete.html'


@login_required
def delete_account(request):
    """Delete user account."""
    if request.method == 'POST':
        user = request.user
        logout(request)
        user.delete()
        messages.success(request, _('Your account has been deleted successfully.'))
        return redirect('core:home')
    
    return render(request, 'auth/delete_account.html')


def guest_mode(request):
    """Enable guest mode for non-authenticated users."""
    # Generate a session token for guest users
    import uuid
    session_token = str(uuid.uuid4())
    request.session['guest_session_token'] = session_token
    
    messages.info(request, _('You are now in guest mode. Some features may be limited.'))
    return redirect('discover')


@login_required
def export_data(request):
    """Export user data."""
    from django.http import HttpResponse
    import json
    
    user = request.user
    
    # Collect user data
    data = {
        'profile': {
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'bio': user.bio,
            'location': user.location,
            'language': user.language,
            'theme': user.theme,
            'include_local_movies': user.include_local_movies,
            'content_rating': user.content_rating,
            'date_joined': user.date_joined.isoformat(),
        },
        'watch_history': [],
        'recommendation_sessions': []
    }
    
    # Add watch history
    from apps.core.models import UserWatchHistory
    for history in UserWatchHistory.objects.filter(user=user):
        data['watch_history'].append({
            'movie_title': history.movie.title,
            'movie_year': history.movie.year,
            'rating': history.rating,
            'notes': history.notes,
            'watched_at': history.watched_at.isoformat(),
        })
    
    # Add recommendation sessions
    from apps.core.models import RecommendationSession
    for session in RecommendationSession.objects.filter(user=user):
        data['recommendation_sessions'].append({
            'session_token': session.session_token,
            'genres': session.genres,
            'mood_text': session.mood_text,
            'year_start': session.year_start,
            'year_end': session.year_end,
            'runtime_preference': session.runtime_preference,
            'include_local': session.include_local,
            'created_at': session.created_at.isoformat(),
        })
    
    # Create response
    response = HttpResponse(
        json.dumps(data, indent=2),
        content_type='application/json'
    )
    response['Content-Disposition'] = f'attachment; filename="user_data_{user.username}.json"'
    
    return response


def check_username_availability(request):
    """AJAX endpoint to check username availability."""
    username = request.GET.get('username', '')
    
    if not username:
        return JsonResponse({'available': False, 'message': _('Username is required.')})
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    if User.objects.filter(username=username).exists():
        return JsonResponse({'available': False, 'message': _('Username is already taken.')})
    else:
        return JsonResponse({'available': True, 'message': _('Username is available.')})


def check_email_availability(request):
    """AJAX endpoint to check email availability."""
    email = request.GET.get('email', '')
    
    if not email:
        return JsonResponse({'available': False, 'message': _('Email is required.')})
    
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    if User.objects.filter(email=email).exists():
        return JsonResponse({'available': False, 'message': _('Email is already registered.')})
    else:
        return JsonResponse({'available': True, 'message': _('Email is available.')}) 