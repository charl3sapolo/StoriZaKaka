from django.shortcuts import render
from .models import Movie
from .utils import tmdb_search_movies, tmdb_get_movie_details, TMDBApiError
from django.http import JsonResponse

def home(request):
    # Example context, replace with real data as needed
    context = {
        "total_movies": 5000,
        "total_genres": 20,
        "active_users": "10K+",
        "popular_genres": [],  # Fill with Genre queryset
        "featured_movies": [], # Fill with Movie queryset
        "user_stats": {},
        "recent_recommendations": [],
    }
    return render(request, "pages/home.html", context)

def discover(request):
    return render(request, "pages/discover.html")

def discovery(request):
    query = request.GET.get('q', '')
    genre = request.GET.get('genre')
    rating = request.GET.get('rating')
    year = request.GET.get('year')
    type_ = request.GET.get('type')
    country = request.GET.get('country')
    language = request.GET.get('language')

    filters = {}
    if genre:
        filters['genres__contains'] = genre
    if rating:
        filters['rating__gte'] = float(rating)
    if year:
        filters['year'] = int(year)
    if type_:
        filters['type'] = type_
    if country:
        filters['country__icontains'] = country
    if language:
        filters['language__icontains'] = language

    movies = Movie.objects.filter(title__icontains=query, **filters)
    if not movies.exists():
        # Fetch from TMDB and cache
        try:
            tmdb_results = tmdb_search_movies(query)
            for result in tmdb_results.get('results', []):
                movie, created = Movie.objects.get_or_create(
                    tmdb_id=result['id'],
                    defaults={
                        'title': result.get('title', ''),
                        'overview': result.get('overview', ''),
                        'genres': result.get('genre_ids', []),
                        'rating': result.get('vote_average'),
                        'year': int(result.get('release_date', '0000')[:4]) if result.get('release_date') else None,
                        'type': 'movie',
                        'country': '',
                        'language': result.get('original_language', ''),
                        'poster_path': result.get('poster_path', ''),
                        'backdrop_path': result.get('backdrop_path', ''),
                        'release_date': result.get('release_date', ''),
                        'popularity': result.get('popularity'),
                        'vote_count': result.get('vote_count'),
                    }
                )
            movies = Movie.objects.filter(title__icontains=query, **filters)
        except TMDBApiError as e:
            return JsonResponse({'error': str(e)}, status=503)

    # Serialize movies for response (simplified)
    movie_list = [
        {
            'title': m.title,
            'overview': m.overview,
            'genres': m.genres,
            'rating': m.rating,
            'year': m.year,
            'type': m.type,
            'country': m.country,
            'language': m.language,
            'poster_path': m.poster_path,
            'backdrop_path': m.backdrop_path,
            'release_date': m.release_date,
            'popularity': m.popularity,
            'vote_count': m.vote_count,
        }
        for m in movies
    ]
    return JsonResponse({'results': movie_list})

def about(request):
    """Render the about page"""
    return render(request, "pages/about.html")

def profile(request):
    """Render the profile page (under construction UI)"""
    return render(request, "pages/profile.html")