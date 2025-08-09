"""
URL configuration for movierecommender project.
"""

from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf.urls.i18n import i18n_patterns
from django.conf import settings
from django.conf.urls.static import static
from apps.core import views as core_views
from apps.authentication import views as auth_views

urlpatterns = [
    path('', RedirectView.as_view(url='/home/', permanent=True)),
    path('admin/', admin.site.urls),
    path('i18n/', include('django.conf.urls.i18n')),
    path('accounts/', include('allauth.urls')),
    path('discover/', core_views.discover, name='discover'),
    path('movie-details/', core_views.movie_details, name='movie_details'),
    path('profile/', auth_views.ProfileView.as_view(), name='profile'),
    # API endpoints for movie saving functionality
    path('api/save-movie/', core_views.save_movie, name='save_movie'),
    path('api/saved-movies/', core_views.get_saved_movies, name='get_saved_movies'),
    path('api/update-movie-status/', core_views.update_movie_status, name='update_movie_status'),
    path('api/remove-movie/', core_views.remove_movie, name='remove_movie'),
    path('api/mood-preferences/', core_views.store_mood_preferences, name='store_mood_preferences'),
    path('api/movie-recommendation/', core_views.get_movie_recommendation, name='movie_recommendation'),
]

# Internationalized URL patterns
urlpatterns += i18n_patterns(
    path('home/', include('apps.core.urls', namespace='core')),
    path('auth/', include(('apps.authentication.urls', 'authentication'), namespace='authentication')),
    path('api/', include('apps.api.urls')),
    prefix_default_language=False,
)

# Debug Toolbar
if settings.DEBUG:
    # import debug_toolbar
    # urlpatterns += [
    #     path('__debug__/', include(debug_toolbar.urls)),
    # ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)