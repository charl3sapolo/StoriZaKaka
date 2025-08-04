from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.home, name='home'),
    path('discover/', views.discover, name='discover'),
    path('api/trending/<str:media_type>/', views.fetch_trending, name='fetch_trending'),
]