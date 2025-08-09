"""
Authentication forms for the Movie Recommender application.
"""

from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from apps.core.models import User

class CustomUserCreationForm(UserCreationForm):
    """Custom user registration form."""
    
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': _('Enter your email')
        })
    )
    
       
    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Customize field widgets
        self.fields['username'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': _('Choose a username')
        })
        self.fields['password1'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': _('Enter your password')
        })
        self.fields['password2'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': _('Confirm your password')
        })
        
        # Customize help text
        self.fields['username'].help_text = _('Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.')
        self.fields['password1'].help_text = _('Your password must contain at least 8 characters.')
        self.fields['password2'].help_text = _('Enter the same password as before, for verification.')
    
    def clean_email(self):
        """Validate email uniqueness."""
        email = self.cleaned_data.get('email')
        if email and User.objects.filter(email=email).exists():
            raise forms.ValidationError(_('A user with this email already exists.'))
        return email


class CustomAuthenticationForm(AuthenticationForm):
    """Custom login form."""
    
    email = forms.CharField(
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': _('Enter your email')
        })
    )

    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': _('Enter your password')
        })
    )

    remember_me = forms.BooleanField(
        required=False,
        initial=False,
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )

    def clean(self):
        cleaned_data = super().clean()
        email = cleaned_data.get('email')
        password = cleaned_data.get('password')
        if email and password:
            from django.contrib.auth import authenticate
            user = authenticate(username=email, password=password)
            if user is None:
                raise forms.ValidationError(_('Invalid email or password.'))
            self.user_cache = user
        return cleaned_data


class UserProfileForm(forms.ModelForm):
    """Form for updating user profile."""
    
    class Meta:
        model = User
        fields = ('username', 'email', 'avatar', 'bio', 'location')
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'bio': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'location': forms.TextInput(attrs={'class': 'form-control'}),
        }


class UserPreferencesForm(forms.ModelForm):
    """Form for updating user preferences."""
    
    class Meta:
        model = User
        fields = ('language', 'theme', 'include_local_movies', 'content_rating')
        widgets = {
            'language': forms.Select(attrs={'class': 'form-control'}),
            'theme': forms.Select(attrs={'class': 'form-control'}),
            'include_local_movies': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'content_rating': forms.Select(attrs={'class': 'form-control'}),
        }


class PasswordChangeForm(forms.Form):
    """Form for changing password."""
    
    current_password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': _('Enter your current password')
        })
    )
    
    new_password1 = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': _('Enter your new password')
        })
    )
    
    new_password2 = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': _('Confirm your new password')
        })
    )
    
    def __init__(self, user, *args, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)
    
    def clean_current_password(self):
        """Validate current password."""
        current_password = self.cleaned_data.get('current_password')
        if not self.user.check_password(current_password):
            raise forms.ValidationError(_('Your current password is incorrect.'))
        return current_password
    
    def clean_new_password2(self):
        """Validate new password confirmation."""
        password1 = self.cleaned_data.get('new_password1')
        password2 = self.cleaned_data.get('new_password2')
        
        if password1 and password2:
            if password1 != password2:
                raise forms.ValidationError(_('The two password fields didn\'t match.'))
            if len(password1) < 8:
                raise forms.ValidationError(_('Password must be at least 8 characters long.'))
        
        return password2
    
    def save(self, commit=True):
        """Save the new password."""
        self.user.set_password(self.cleaned_data['new_password1'])
        if commit:
            self.user.save()
        return self.user


class PasswordResetForm(forms.Form):
    """Form for password reset request."""
    
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': _('Enter your email address')
        })
    )
    
    def clean_email(self):
        """Validate email exists."""
        email = self.cleaned_data.get('email')
        if not User.objects.filter(email=email, is_active=True).exists():
            raise forms.ValidationError(_('No user found with this email address.'))
        return email


class SetPasswordForm(forms.Form):
    """Form for setting new password after reset."""
    
    new_password1 = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': _('Enter your new password')
        })
    )
    
    new_password2 = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': _('Confirm your new password')
        })
    )
    
    def clean_new_password2(self):
        """Validate password confirmation."""
        password1 = self.cleaned_data.get('new_password1')
        password2 = self.cleaned_data.get('new_password2')
        
        if password1 and password2:
            if password1 != password2:
                raise forms.ValidationError(_('The two password fields didn\'t match.'))
            if len(password1) < 8:
                raise forms.ValidationError(_('Password must be at least 8 characters long.'))
        
        return password2 