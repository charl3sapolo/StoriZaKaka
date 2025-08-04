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