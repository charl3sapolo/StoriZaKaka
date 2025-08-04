from django.shortcuts import render
from .models import Movie
from .utils import tmdb_search_movies, tmdb_get_movie_details, TMDBApiError
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.db import transaction

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
        "TMDB_API_KEY": settings.TMDB_API_KEY,
    }
    return render(request, "pages/home.html", context)

def discover(request):
    return render(request, "pages/discover.html", {"TMDB_API_KEY": settings.TMDB_API_KEY})

def movie_details(request):
    """Render the My Movies page"""
    return render(request, "pages/movie_detail.html", {
        'page_title': 'My Movies',
        'is_movie_details': True
    })

@csrf_exempt
@require_http_methods(["POST"])
def store_mood_preferences(request):
    """
    Store mood preferences for both logged-in and anonymous users.
    
    Expected JSON payload:
    {
        "mood_preferences": ["comedy", "drama", "action"],
        "session_id": "anon_1234567890_abc123",
        "is_logged_in": false
    }
    """
    try:
        data = json.loads(request.body)
        mood_preferences = data.get('mood_preferences', [])
        session_id = data.get('session_id')
        is_logged_in = data.get('is_logged_in', False)
        
        if not mood_preferences:
            return JsonResponse({
                'error': 'No mood preferences provided'
            }, status=400)
        
        with transaction.atomic():
            if is_logged_in and request.user.is_authenticated:
                # Store for logged-in user
                user = request.user
                
                # Update user's mood preferences
                if hasattr(user, 'mood_preferences'):
                    user.mood_preferences = mood_preferences
                    user.last_mood_update = timezone.now()
                    user.save()
                else:
                    # If User model doesn't have mood_preferences field,
                    # create a separate model or use JSONField
                    from .models import UserMoodPreference
                    UserMoodPreference.objects.update_or_create(
                        user=user,
                        defaults={
                            'mood_preferences': mood_preferences,
                            'last_updated': timezone.now()
                        }
                    )
                
                return JsonResponse({
                    'success': True,
                    'message': 'Mood preferences stored for user',
                    'user_id': user.id
                })
            else:
                # Store for anonymous user
                if not session_id:
                    return JsonResponse({
                        'error': 'Session ID required for anonymous users'
                    }, status=400)
                
                from .models import AnonymousMoodSession
                AnonymousMoodSession.objects.update_or_create(
                    session_id=session_id,
                    defaults={
                        'mood_preferences': mood_preferences,
                        'created_at': timezone.now()
                    }
                )
                
                return JsonResponse({
                    'success': True,
                    'message': 'Mood preferences stored for anonymous session',
                    'session_id': session_id
                })
                
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON payload'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': f'Server error: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def save_movie(request):
    """
    Save a movie for both logged-in and anonymous users.
    
    Expected JSON payload:
    {
        "tmdb_id": 123,
        "title": "Movie Title",
        "overview": "Movie description...",
        "poster_path": "/path/to/poster.jpg",
        "backdrop_path": "/path/to/backdrop.jpg",
        "release_date": "2023-01-01",
        "vote_average": 8.5,
        "vote_count": 1000,
        "genre_ids": [28, 12, 16],
        "media_type": "movie",
        "session_id": "anon_1234567890_abc123",  # Only for anonymous users
        "is_logged_in": false
    }
    """
    try:
        data = json.loads(request.body)
        tmdb_id = data.get('tmdb_id')
        title = data.get('title')
        overview = data.get('overview', '')
        poster_path = data.get('poster_path', '')
        backdrop_path = data.get('backdrop_path', '')
        release_date = data.get('release_date', '')
        vote_average = data.get('vote_average')
        vote_count = data.get('vote_count')
        genre_ids = data.get('genre_ids', [])
        media_type = data.get('media_type', 'movie')
        session_id = data.get('session_id')
        is_logged_in = data.get('is_logged_in', False)
        
        if not tmdb_id or not title:
            return JsonResponse({
                'error': 'TMDB ID and title are required'
            }, status=400)
        
        with transaction.atomic():
            if is_logged_in and request.user.is_authenticated:
                # Save for logged-in user
                from .models import SavedMovie
                saved_movie, created = SavedMovie.objects.update_or_create(
                    user=request.user,
                    tmdb_id=tmdb_id,
                    media_type=media_type,
                    defaults={
                        'title': title,
                        'overview': overview,
                        'poster_path': poster_path,
                        'backdrop_path': backdrop_path,
                        'release_date': release_date,
                        'vote_average': vote_average,
                        'vote_count': vote_count,
                        'genre_ids': genre_ids,
                    }
                )
                
                return JsonResponse({
                    'success': True,
                    'message': f'Movie "{title}" saved successfully',
                    'created': created,
                    'movie_id': saved_movie.id
                })
            else:
                # Save for anonymous user (expires in 1 day)
                if not session_id:
                    return JsonResponse({
                        'error': 'Session ID required for anonymous users'
                    }, status=400)
                
                from .models import AnonymousSavedMovie
                from datetime import timedelta
                
                # Set expiration to 1 day from now
                expires_at = timezone.now() + timedelta(days=1)
                
                saved_movie, created = AnonymousSavedMovie.objects.update_or_create(
                    session_id=session_id,
                    tmdb_id=tmdb_id,
                    media_type=media_type,
                    defaults={
                        'title': title,
                        'overview': overview,
                        'poster_path': poster_path,
                        'backdrop_path': backdrop_path,
                        'release_date': release_date,
                        'vote_average': vote_average,
                        'vote_count': vote_count,
                        'genre_ids': genre_ids,
                        'expires_at': expires_at,
                    }
                )
                
                return JsonResponse({
                    'success': True,
                    'message': f'Movie "{title}" saved (expires in 1 day)',
                    'created': created,
                    'movie_id': saved_movie.id
                })
                
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON payload'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': f'Server error: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_saved_movies(request):
    """
    Get saved movies for both logged-in and anonymous users.
    
    Query parameters:
    - session_id: Required for anonymous users
    - is_logged_in: Boolean indicating if user is logged in
    """
    try:
        is_logged_in = request.GET.get('is_logged_in', 'false').lower() == 'true'
        session_id = request.GET.get('session_id')
        
        if is_logged_in and request.user.is_authenticated:
            # Get saved movies for logged-in user
            from .models import SavedMovie
            saved_movies = SavedMovie.objects.filter(user=request.user).order_by('-saved_at')
            
            movies_data = []
            for movie in saved_movies:
                movies_data.append({
                    'id': movie.id,
                    'tmdb_id': movie.tmdb_id,
                    'title': movie.title,
                    'overview': movie.overview,
                    'poster_path': movie.poster_path,
                    'backdrop_path': movie.backdrop_path,
                    'release_date': movie.release_date,
                    'vote_average': movie.vote_average,
                    'vote_count': movie.vote_count,
                    'genre_ids': movie.genre_ids,
                    'media_type': movie.media_type,
                    'saved_at': movie.saved_at.isoformat(),
                    'is_liked': movie.is_liked,
                    'is_watch_later': movie.is_watch_later,
                })
            
            return JsonResponse({
                'success': True,
                'movies': movies_data,
                'count': len(movies_data)
            })
        else:
            # Get saved movies for anonymous user
            if not session_id:
                return JsonResponse({
                    'error': 'Session ID required for anonymous users'
                }, status=400)
            
            from .models import AnonymousSavedMovie
            from django.utils import timezone
            
            # Clean up expired movies first
            AnonymousSavedMovie.objects.filter(expires_at__lt=timezone.now()).delete()
            
            saved_movies = AnonymousSavedMovie.objects.filter(
                session_id=session_id
            ).order_by('-saved_at')
            
            movies_data = []
            for movie in saved_movies:
                movies_data.append({
                    'id': movie.id,
                    'tmdb_id': movie.tmdb_id,
                    'title': movie.title,
                    'overview': movie.overview,
                    'poster_path': movie.poster_path,
                    'backdrop_path': movie.backdrop_path,
                    'release_date': movie.release_date,
                    'vote_average': movie.vote_average,
                    'vote_count': movie.vote_count,
                    'genre_ids': movie.genre_ids,
                    'media_type': movie.media_type,
                    'saved_at': movie.saved_at.isoformat(),
                    'expires_at': movie.expires_at.isoformat(),
                    'is_liked': movie.is_liked,
                    'is_watch_later': movie.is_watch_later,
                })
            
            return JsonResponse({
                'success': True,
                'movies': movies_data,
                'count': len(movies_data)
            })
            
    except Exception as e:
        return JsonResponse({
            'error': f'Server error: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def update_movie_status(request):
    """
    Update like/watch later status for saved movies.
    
    Expected JSON payload:
    {
        "movie_id": 123,
        "is_liked": true,
        "is_watch_later": false,
        "session_id": "anon_1234567890_abc123",  # Only for anonymous users
        "is_logged_in": false
    }
    """
    try:
        data = json.loads(request.body)
        movie_id = data.get('movie_id')
        is_liked = data.get('is_liked', False)
        is_watch_later = data.get('is_watch_later', False)
        session_id = data.get('session_id')
        is_logged_in = data.get('is_logged_in', False)
        
        if not movie_id:
            return JsonResponse({
                'error': 'Movie ID is required'
            }, status=400)
        
        with transaction.atomic():
            if is_logged_in and request.user.is_authenticated:
                # Update for logged-in user
                from .models import SavedMovie
                try:
                    saved_movie = SavedMovie.objects.get(
                        id=movie_id,
                        user=request.user
                    )
                    saved_movie.is_liked = is_liked
                    saved_movie.is_watch_later = is_watch_later
                    saved_movie.save()
                    
                    return JsonResponse({
                        'success': True,
                        'message': 'Movie status updated successfully'
                    })
                except SavedMovie.DoesNotExist:
                    return JsonResponse({
                        'error': 'Movie not found'
                    }, status=404)
            else:
                # Update for anonymous user
                if not session_id:
                    return JsonResponse({
                        'error': 'Session ID required for anonymous users'
                    }, status=400)
                
                from .models import AnonymousSavedMovie
                try:
                    saved_movie = AnonymousSavedMovie.objects.get(
                        id=movie_id,
                        session_id=session_id
                    )
                    saved_movie.is_liked = is_liked
                    saved_movie.is_watch_later = is_watch_later
                    saved_movie.save()
                    
                    return JsonResponse({
                        'success': True,
                        'message': 'Movie status updated successfully'
                    })
                except AnonymousSavedMovie.DoesNotExist:
                    return JsonResponse({
                        'error': 'Movie not found'
                    }, status=404)
                
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON payload'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': f'Server error: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def remove_movie(request):
    """
    Remove a movie from saved movies.
    
    Expected JSON payload:
    {
        "movie_id": 123,
        "session_id": "anon_1234567890_abc123",  # Only for anonymous users
        "is_logged_in": false
    }
    """
    try:
        data = json.loads(request.body)
        movie_id = data.get('movie_id')
        session_id = data.get('session_id')
        is_logged_in = data.get('is_logged_in', False)
        
        if not movie_id:
            return JsonResponse({
                'error': 'Movie ID is required'
            }, status=400)
        
        with transaction.atomic():
            if is_logged_in and request.user.is_authenticated:
                # Remove from database for logged-in user
                from .models import SavedMovie
                try:
                    saved_movie = SavedMovie.objects.get(
                        id=movie_id,
                        user=request.user
                    )
                    saved_movie.delete()
                    
                    return JsonResponse({
                        'success': True,
                        'message': 'Movie removed successfully'
                    })
                except SavedMovie.DoesNotExist:
                    return JsonResponse({
                        'error': 'Movie not found'
                    }, status=404)
            else:
                # Remove from database for anonymous user
                if not session_id:
                    return JsonResponse({
                        'error': 'Session ID required for anonymous users'
                    }, status=400)
                
                from .models import AnonymousSavedMovie
                try:
                    saved_movie = AnonymousSavedMovie.objects.get(
                        id=movie_id,
                        session_id=session_id
                    )
                    saved_movie.delete()
                    
                    return JsonResponse({
                        'success': True,
                        'message': 'Movie removed successfully'
                    })
                except AnonymousSavedMovie.DoesNotExist:
                    return JsonResponse({
                        'error': 'Movie not found'
                    }, status=404)
                
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON payload'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'error': f'Server error: {str(e)}'
        }, status=500)

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

def get_movie_recommendation(request):
    """API endpoint for getting movie recommendations based on questionnaire answers"""
    from django.http import JsonResponse
    import requests
    
    try:
        # Get parameters from request
        mood = request.GET.get('mood')
        genre = request.GET.get('genre')
        era = request.GET.get('era')
        intensity = request.GET.get('intensity')
        duration = request.GET.get('duration')
        
        # Build TMDB API parameters
        params = {
            'api_key': settings.TMDB_API_KEY,
            'language': 'en-US',
            'sort_by': 'popularity.desc',
            'include_adult': False,
            'include_video': False,
            'page': 1
        }
        
        # Add filters based on answers
        if mood:
            mood_mapping = {
                'happy': {'with_genres': '35'},
                'sad': {'with_genres': '18'},
                'excited': {'with_genres': '28'},
                'calm': {'with_genres': '16'},
                'stressed': {'with_genres': '53'},
                'romantic': {'with_genres': '10749'},
                'adventurous': {'with_genres': '12'},
                'nostalgic': {'with_genres': '10751'}
            }
            if mood in mood_mapping:
                params.update(mood_mapping[mood])
        
        if genre:
            genre_mapping = {
                'comedy': {'with_genres': '35'},
                'horror': {'with_genres': '27'},
                'sci-fi': {'with_genres': '878'},
                'action': {'with_genres': '28'},
                'documentary': {'with_genres': '99'}
            }
            if genre in genre_mapping:
                params.update(genre_mapping[genre])
        
        if era:
            era_mapping = {
                '2000s': {'primary_release_year': '2000', 'primary_release_date.gte': '2000-01-01', 'primary_release_date.lte': '2009-12-31'},
                '90s': {'primary_release_year': '1990', 'primary_release_date.gte': '1990-01-01', 'primary_release_date.lte': '1999-12-31'},
                'recent': {'primary_release_date.gte': '2020-01-01'},
                'classic': {'primary_release_date.lte': '1980-12-31'}
            }
            if era in era_mapping:
                params.update(era_mapping[era])
        
        if intensity:
            intensity_mapping = {
                'light': {'vote_average.gte': '6', 'vote_average.lte': '8'},
                'medium': {'vote_average.gte': '6.5', 'vote_average.lte': '8.5'},
                'dark': {'vote_average.gte': '7', 'vote_average.lte': '9'},
                'epic': {'vote_average.gte': '7.5', 'vote_average.lte': '10'}
            }
            if intensity in intensity_mapping:
                params.update(intensity_mapping[intensity])
        
        if duration:
            duration_mapping = {
                'short': {'with_runtime.lte': '90'},
                'standard': {'with_runtime.gte': '90', 'with_runtime.lte': '120'},
                'long': {'with_runtime.gte': '120'},
                'series': {'with_genres': '10770'}
            }
            if duration in duration_mapping:
                params.update(duration_mapping[duration])
        
        # Fetch from TMDB
        response = requests.get(f'https://api.themoviedb.org/3/discover/movie', params=params)
        data = response.json()
        
        if data.get('results') and len(data['results']) > 0:
            movie = data['results'][0]
            return JsonResponse({
                'success': True,
                'movie': movie
            })
        else:
            # Fallback to popular movies
            fallback_response = requests.get(
                f'https://api.themoviedb.org/3/movie/popular',
                params={'api_key': settings.TMDB_API_KEY, 'language': 'en-US', 'page': 1}
            )
            fallback_data = fallback_response.json()
            
            if fallback_data.get('results') and len(fallback_data['results']) > 0:
                movie = fallback_data['results'][0]
                return JsonResponse({
                    'success': True,
                    'movie': movie
                })
            else:
                return JsonResponse({
                    'success': False,
                    'error': 'No movies found'
                }, status=404)
                
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)