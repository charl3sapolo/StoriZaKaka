from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.home, name='home'),
    path('discover/', views.discover, name='discover'),
    path('movie-details/', views.movie_details, name='movie_details'),
    path('profile/', views.profile, name='profile'),
    path('api/trending/<str:media_type>/', views.fetch_trending, name='fetch_trending'),
    path('test-questionnaire/', views.test_questionnaire, name='test_questionnaire'),
]
