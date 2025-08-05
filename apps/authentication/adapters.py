from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.adapter import DefaultAccountAdapter
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Custom adapter for social account authentication.
    Ensures proper user creation and data saving for Google OAuth.
    """
    
    def pre_social_login(self, request, sociallogin):
        """
        Invoked just after a user successfully authenticates via a
        social provider, but before the login is actually processed.
        """
        # Get the user from the social login
        user = sociallogin.user
        
        # If user doesn't exist, create one
        if not user.pk:
            # Check if a user with this email already exists
            try:
                existing_user = User.objects.get(email=user.email)
                # Link the social account to the existing user
                sociallogin.connect(request, existing_user)
                return
            except User.DoesNotExist:
                # Create new user
                user = self.create_user_from_social(sociallogin)
                sociallogin.user = user
    
    def create_user_from_social(self, sociallogin):
        """
        Create a new user from social login data.
        """
        provider = sociallogin.account.provider
        extra_data = sociallogin.account.extra_data
        
        # Extract user data from Google OAuth
        if provider == 'google':
            email = extra_data.get('email')
            first_name = extra_data.get('given_name', '')
            last_name = extra_data.get('family_name', '')
            username = extra_data.get('email', '').split('@')[0]  # Use email prefix as username
            
            # Ensure username is unique
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            # Create user with transaction to ensure data integrity
            with transaction.atomic():
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    password=None  # Social users don't need password
                )
                
                # Set additional fields if available
                if 'picture' in extra_data:
                    user.avatar = extra_data['picture']
                
                user.save()
                return user
        
        return super().create_user_from_social(sociallogin)
    
    def populate_user(self, request, sociallogin, data):
        """
        Populate user data from social login.
        """
        user = super().populate_user(request, sociallogin, data)
        
        # Set additional user fields from Google data
        if sociallogin.account.provider == 'google':
            extra_data = sociallogin.account.extra_data
            
            # Set name fields
            if 'given_name' in extra_data:
                user.first_name = extra_data['given_name']
            if 'family_name' in extra_data:
                user.last_name = extra_data['family_name']
            
            # Set avatar if available
            if 'picture' in extra_data:
                user.avatar = extra_data['picture']
        
        return user

class CustomAccountAdapter(DefaultAccountAdapter):
    """
    Custom account adapter for local authentication.
    """
    
    def save_user(self, request, user, form, commit=True):
        """
        Save user with additional fields.
        """
        user = super().save_user(request, user, form, commit=False)
        
        # Set additional fields from form if available
        if hasattr(form, 'cleaned_data'):
            if 'first_name' in form.cleaned_data:
                user.first_name = form.cleaned_data['first_name']
            if 'last_name' in form.cleaned_data:
                user.last_name = form.cleaned_data['last_name']
        
        if commit:
            user.save()
        
        return user 