from django.urls import path
from . import views

app_name = "core"

urlpatterns = [
    path('', views.home, name='home'),
    path('discover/', views.discover, name='discover'),
    path('discovery/', views.discovery, name='discovery'),
    path('about/', views.about, name='about'),
    path('movie-details/', views.movie_details, name='movie_details'),
    path('profile/', views.profile, name='profile'),
    path('api/movie-recommendation/', views.get_movie_recommendation, name='movie_recommendation'),
    path('api/mood-preferences/', views.store_mood_preferences, name='store_mood_preferences'),
    path('api/save-movie/', views.save_movie, name='save_movie'),
    path('api/saved-movies/', views.get_saved_movies, name='get_saved_movies'),
    path('api/update-movie-status/', views.update_movie_status, name='update_movie_status'),
    path('api/remove-movie/', views.remove_movie, name='remove_movie'),
    # ... other routes ...
]