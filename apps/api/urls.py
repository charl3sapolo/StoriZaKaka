"""
URL patterns for the API app.
"""

from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    # Recommendations
    path('recommendations/', views.get_recommendations, name='recommendations'),
    
    # Search
    path('search/', views.search_movies, name='search'),
    
    # Movie details
    path('movie/<int:movie_id>/', views.get_movie_details, name='movie_details'),
    path('movie/<int:movie_id>/rate/', views.rate_movie_api, name='rate_movie'),
    path('movie/<int:movie_id>/watchlist/', views.add_to_watchlist_api, name='add_to_watchlist'),
    
    # User data
    path('watchlist/', views.get_user_watchlist, name='watchlist'),
    path('user/movie-counts/', views.get_user_movie_counts, name='user_movie_counts'),
    path('user/movies/', views.get_user_movies, name='user_movies'),
    path('save-movie/', views.save_movie_api, name='save_movie'),
    
    # Content
    path('genres/', views.get_genres, name='genres'),
    path('featured/', views.get_featured_movies, name='featured'),
    path('local/', views.get_local_movies, name='local'),
    path('stats/', views.get_movie_stats, name='stats'),
    
    # Feedback
    path('feedback/', views.provide_feedback, name='feedback'),
] 