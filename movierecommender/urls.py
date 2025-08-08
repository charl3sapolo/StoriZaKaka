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
]

# Internationalized URL patterns
urlpatterns += i18n_patterns(
    path('home/', include('core.urls', namespace='core')),
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