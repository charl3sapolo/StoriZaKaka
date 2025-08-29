from django.core.management.base import BaseCommand
from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
from django.conf import settings
from decouple import config

class Command(BaseCommand):
    help = 'Fix duplicate Google OAuth apps and ensure proper configuration'

    def handle(self, *args, **options):
        try:
            # Get or create the default site
            site, created = Site.objects.get_or_create(
                id=settings.SITE_ID,
                defaults={
                    'domain': '127.0.0.1:8000',
                    'name': 'MoviePicker'
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created site: {site.name} ({site.domain})')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'Using existing site: {site.name} ({site.domain})')
                )

            # Get Google OAuth credentials from environment
            client_id = config('GOOGLE_CLIENT_ID', default='')
            client_secret = config('GOOGLE_CLIENT_SECRET', default='')
            
            if not client_id or not client_secret:
                self.stdout.write(
                    self.style.WARNING(
                        'Google OAuth credentials not found in environment variables. '
                        'Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.'
                    )
                )
                return

            # Check for existing Google OAuth apps
            existing_apps = SocialApp.objects.filter(provider='google')
            
            if existing_apps.count() > 1:
                self.stdout.write(
                    self.style.WARNING(f'Found {existing_apps.count()} Google OAuth apps. Cleaning up...')
                )
                
                # Delete all existing Google OAuth apps
                existing_apps.delete()
                self.stdout.write(
                    self.style.SUCCESS('Deleted all existing Google OAuth apps')
                )
            
            # Create a single Google OAuth app
            social_app, created = SocialApp.objects.get_or_create(
                provider='google',
                defaults={
                    'name': 'Google OAuth',
                    'client_id': client_id,
                    'secret': client_secret,
                }
            )
            
            if not created:
                # Update existing app with new credentials
                social_app.client_id = client_id
                social_app.secret = client_secret
                social_app.save()
                self.stdout.write(
                    self.style.SUCCESS('Updated existing Google OAuth app')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS('Created new Google OAuth app')
                )

            # Clear all sites from the app and add only the correct one
            social_app.sites.clear()
            social_app.sites.add(site)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully configured Google OAuth provider:\n'
                    f'  - Provider: Google\n'
                    f'  - Client ID: {client_id[:10]}...\n'
                    f'  - Site: {site.name} ({site.domain})\n'
                    f'  - Total apps: {SocialApp.objects.filter(provider="google").count()}'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error fixing Google OAuth: {str(e)}')
            ) 