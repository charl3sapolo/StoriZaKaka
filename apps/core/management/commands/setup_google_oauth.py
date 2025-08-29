from django.core.management.base import BaseCommand
from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialApp
from django.conf import settings
from decouple import config

class Command(BaseCommand):
    help = 'Set up Google OAuth provider for allauth'

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

            # Create or update Google OAuth app
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

            # Add site to social app
            social_app.sites.add(site)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully set up Google OAuth provider:\n'
                    f'  - Provider: Google\n'
                    f'  - Client ID: {client_id[:10]}...\n'
                    f'  - Site: {site.name} ({site.domain})'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error setting up Google OAuth: {str(e)}')
            ) 