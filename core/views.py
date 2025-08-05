from django.shortcuts import render
from django.http import JsonResponse
import requests
from django.conf import settings
import json

def home(request):
    return render(request, 'pages/home.html', {
        'page_title': 'Stori za Kaka',
        'is_home': True
    })

def discover(request):
    return render(request, 'pages/discover.html', {
        'page_title': 'Discover Movies & Shows',
        'is_discover': True
    })

def movie_details(request):
    return render(request, 'pages/movie_detail.html', {
        'page_title': 'My Movies',
        'is_movie_details': True
    })

def profile(request):
    return render(request, 'pages/profile.html', {
        'page_title': 'Profile',
        'is_profile': True
    })

def fetch_trending(request, media_type):
    page = request.GET.get('page', 1)
    
    try:
        response = requests.get(
            f"{settings.TMDB_API_URL}/trending/{media_type}/week",
            params={
                'api_key': settings.TMDB_API_KEY,
                'page': page
            }
        )
        response.raise_for_status()
        return JsonResponse(response.json())
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def test_questionnaire(request):
    return render(request, 'pages/test_questionnaire.html', {
        'page_title': 'Questionnaire Test',
        'is_test': True
    })