"""
URL configuration for movierecommender project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf.urls.i18n import i18n_patterns
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('i18n/', include('django.conf.urls.i18n')),
]

# Internationalized URL patterns
urlpatterns += i18n_patterns(
    path('', include('apps.core.urls', namespace='core')),
    path('auth/', include(('apps.authentication.urls', 'authentication'), namespace='authentication')),
    path('api/', include('apps.api.urls')),
    prefix_default_language=False,
)

# Debug Toolbar
if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [
        path('__debug__/', include(debug_toolbar.urls)),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)