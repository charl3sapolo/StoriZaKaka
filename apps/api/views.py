"""
API views for AJAX functionality in the Movie Recommender application.
"""

from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.shortcuts import get_object_or_404
from django.db.models import Q
import json
from django.utils import timezone

from apps.core.models import Movie, Genre, UserWatchHistory, RecommendationSession
from apps.recommendations.engine import RecommendationEngine


@require_http_methods(["GET"])
def get_recommendations(request):
    """Get movie recommendations via AJAX."""
    
    # Get parameters
    genres = request.GET.getlist('genres')
    mood_text = request.GET.get('mood', '')
    year_start = request.GET.get('year_start')
    year_end = request.GET.get('year_end')
    runtime_preference = request.GET.get('runtime_preference', '')
    include_local = request.GET.get('include_local', 'true').lower() == 'true'
    limit = int(request.GET.get('limit', 20))
    
    # Convert year parameters to integers
    if year_start:
        year_start = int(year_start)
    if year_end:
        year_end = int(year_end)
    
    # Get user and session token
    user = request.user if request.user.is_authenticated else None
    session_token = request.session.get('guest_session_token')
    
    # Get recommendations
    engine = RecommendationEngine()
    recommendations = engine.get_recommendations(
        user=user,
        session_token=session_token,
        genres=genres,
        mood_text=mood_text,
        year_start=year_start,
        year_end=year_end,
        runtime_preference=runtime_preference,
        include_local=include_local,
        limit=limit
    )
    
    # Format response
    movies_data = []
    for rec in recommendations:
        movie = rec['movie']
        movies_data.append({
            'id': movie.id,
            'title': movie.title,
            'title_sw': movie.title_sw,
            'year': movie.year,
            'overview': movie.overview,
            'overview_sw': movie.overview_sw,
            'poster_path': movie.poster_path,
            'backdrop_path': movie.backdrop_path,
            'runtime': movie.runtime,
            'genres': [{'id': g.id, 'name': g.name, 'name_sw': g.name_sw} for g in movie.genres.all()],
            'tmdb_rating': movie.tmdb_rating,
            'imdb_rating': movie.imdb_rating,
            'local_rating': movie.local_rating,
            'average_rating': movie.average_rating,
            'is_local': movie.is_local,
            'is_featured': movie.is_featured,
            'content_rating': movie.content_rating,
            'score': rec['score'],
            'reasons': rec['reasons'],
            'detail_url': f'/movie/{movie.id}/'
        })
    
    return JsonResponse({
        'success': True,
        'movies': movies_data,
        'total': len(movies_data)
    })


@require_http_methods(["GET"])
def search_movies(request):
    """Search movies via AJAX."""
    
    query = request.GET.get('q', '')
    if len(query) < 2:
        return JsonResponse({'success': True, 'movies': [], 'total': 0})
    
    # Search in title, overview, and cast
    movies = Movie.objects.filter(
        Q(title__icontains=query) |
        Q(title_sw__icontains=query) |
        Q(overview__icontains=query) |
        Q(overview_sw__icontains=query) |
        Q(cast__name__icontains=query)
    ).distinct()[:20]
    
    movies_data = []
    for movie in movies:
        movies_data.append({
            'id': movie.id,
            'title': movie.title,
            'title_sw': movie.title_sw,
            'year': movie.year,
            'overview': movie.overview[:200] + '...' if len(movie.overview) > 200 else movie.overview,
            'poster_path': movie.poster_path,
            'genres': [g.name for g in movie.genres.all()],
            'average_rating': movie.average_rating,
            'is_local': movie.is_local,
            'detail_url': f'/movie/{movie.id}/'
        })
    
    return JsonResponse({
        'success': True,
        'movies': movies_data,
        'total': len(movies_data),
        'query': query
    })


@require_http_methods(["GET"])
def get_genres(request):
    """Get all available genres."""
    
    genres = Genre.objects.filter(is_active=True).order_by('name')
    genres_data = []
    
    for genre in genres:
        genres_data.append({
            'id': genre.id,
            'name': genre.name,
            'name_sw': genre.name_sw,
            'description': genre.description,
            'description_sw': genre.description_sw,
            'color_primary': genre.color_primary,
            'color_secondary': genre.color_secondary,
            'icon_name': genre.icon_name,
            'movie_count': genre.movies.count()
        })
    
    return JsonResponse({
        'success': True,
        'genres': genres_data
    })


@require_http_methods(["GET"])
def get_movie_details(request, movie_id):
    """Get detailed movie information."""
    
    movie = get_object_or_404(Movie, id=movie_id)
    
    # Get user rating if logged in
    user_rating = None
    if request.user.is_authenticated:
        try:
            watch_history = UserWatchHistory.objects.get(
                user=request.user,
                movie=movie
            )
            user_rating = {
                'rating': watch_history.rating,
                'notes': watch_history.notes,
                'watched_at': watch_history.watched_at.isoformat()
            }
        except UserWatchHistory.DoesNotExist:
            pass
    
    # Get similar movies
    engine = RecommendationEngine()
    similar_movies = engine.get_similar_movies(movie, limit=6)
    
    similar_data = []
    for sim in similar_movies:
        similar_data.append({
            'id': sim['movie'].id,
            'title': sim['movie'].title,
            'year': sim['movie'].year,
            'poster_path': sim['movie'].poster_path,
            'score': sim['score'],
            'reasons': sim['reasons'],
            'detail_url': f'/movie/{sim["movie"].id}/'
        })
    
    movie_data = {
        'id': movie.id,
        'title': movie.title,
        'title_sw': movie.title_sw,
        'year': movie.year,
        'overview': movie.overview,
        'overview_sw': movie.overview_sw,
        'poster_path': movie.poster_path,
        'backdrop_path': movie.backdrop_path,
        'runtime': movie.runtime,
        'genres': [{'id': g.id, 'name': g.name, 'name_sw': g.name_sw} for g in movie.genres.all()],
        'tmdb_rating': movie.tmdb_rating,
        'imdb_rating': movie.imdb_rating,
        'local_rating': movie.local_rating,
        'average_rating': movie.average_rating,
        'is_local': movie.is_local,
        'is_featured': movie.is_featured,
        'content_rating': movie.content_rating,
        'budget': movie.budget,
        'revenue': movie.revenue,
        'production_companies': movie.production_companies,
        'production_countries': movie.production_countries,
        'cast': [{'name': c.name, 'character': c.character, 'profile_path': c.profile_path} for c in movie.cast.all()],
        'crew': [{'name': c.name, 'job': c.job, 'department': c.department} for c in movie.crew.all()],
        'user_rating': user_rating,
        'similar_movies': similar_data,
        'total_ratings': UserWatchHistory.objects.filter(movie=movie, rating__isnull=False).count()
    }
    
    return JsonResponse({
        'success': True,
        'movie': movie_data
    })


@login_required
@require_http_methods(["POST"])
def rate_movie_api(request, movie_id):
    """Rate a movie via AJAX."""
    
    try:
        data = json.loads(request.body)
        rating = data.get('rating')
        notes = data.get('notes', '')
        
        movie = get_object_or_404(Movie, id=movie_id)
        
        if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
            return JsonResponse({
                'success': False,
                'message': 'Rating must be between 1 and 5.'
            }, status=400)
        
        # Create or update watch history
        watch_history, created = UserWatchHistory.objects.get_or_create(
            user=request.user,
            movie=movie,
            defaults={'rating': rating, 'notes': notes}
        )
        
        if not created:
            watch_history.rating = rating
            watch_history.notes = notes
            watch_history.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Rating saved successfully!',
            'rating': rating,
            'notes': notes
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data.'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


@login_required
@require_http_methods(["POST"])
def add_to_watchlist_api(request, movie_id):
    """Add movie to watchlist via AJAX."""
    
    try:
        movie = get_object_or_404(Movie, id=movie_id)
        
        # Create watch history entry (without rating)
        watch_history, created = UserWatchHistory.objects.get_or_create(
            user=request.user,
            movie=movie
        )
        
        if created:
            message = 'Movie added to watchlist!'
        else:
            message = 'Movie is already in your watchlist.'
        
        return JsonResponse({
            'success': True,
            'message': message,
            'in_watchlist': True
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


@login_required
@require_http_methods(["GET"])
def get_user_watchlist(request):
    """Get user's watchlist."""
    
    watchlist = UserWatchHistory.objects.filter(
        user=request.user
    ).select_related('movie').order_by('-watched_at')
    
    movies_data = []
    for item in watchlist:
        movie = item.movie
        movies_data.append({
            'id': movie.id,
            'title': movie.title,
            'year': movie.year,
            'poster_path': movie.poster_path,
            'rating': item.rating,
            'notes': item.notes,
            'watched_at': item.watched_at.isoformat(),
            'detail_url': f'/movie/{movie.id}/'
        })
    
    return JsonResponse({
        'success': True,
        'movies': movies_data,
        'total': len(movies_data)
    })


@require_http_methods(["GET"])
def get_featured_movies(request):
    """Get featured movies."""
    
    featured_movies = Movie.objects.filter(
        is_featured=True
    ).order_by('-year')[:6]
    
    movies_data = []
    for movie in featured_movies:
        movies_data.append({
            'id': movie.id,
            'title': movie.title,
            'title_sw': movie.title_sw,
            'year': movie.year,
            'overview': movie.overview[:150] + '...' if len(movie.overview) > 150 else movie.overview,
            'poster_path': movie.poster_path,
            'backdrop_path': movie.backdrop_path,
            'genres': [g.name for g in movie.genres.all()],
            'average_rating': movie.average_rating,
            'is_local': movie.is_local,
            'detail_url': f'/movie/{movie.id}/'
        })
    
    return JsonResponse({
        'success': True,
        'movies': movies_data
    })


@require_http_methods(["GET"])
def get_local_movies(request):
    """Get local Tanzanian movies."""
    
    local_movies = Movie.objects.filter(
        is_local=True
    ).order_by('-year')[:12]
    
    movies_data = []
    for movie in local_movies:
        movies_data.append({
            'id': movie.id,
            'title': movie.title,
            'title_sw': movie.title_sw,
            'year': movie.year,
            'overview': movie.overview[:150] + '...' if len(movie.overview) > 150 else movie.overview,
            'poster_path': movie.poster_path,
            'genres': [g.name for g in movie.genres.all()],
            'average_rating': movie.average_rating,
            'detail_url': f'/movie/{movie.id}/'
        })
    
    return JsonResponse({
        'success': True,
        'movies': movies_data,
        'total': len(movies_data)
    })


@require_http_methods(["GET"])
def get_movie_stats(request):
    """Get movie statistics."""
    
    total_movies = Movie.objects.count()
    local_movies = Movie.objects.filter(is_local=True).count()
    featured_movies = Movie.objects.filter(is_featured=True).count()
    
    # Get genre statistics
    genre_stats = []
    genres = Genre.objects.filter(is_active=True)
    for genre in genres:
        genre_stats.append({
            'name': genre.name,
            'name_sw': genre.name_sw,
            'count': genre.movies.count(),
            'color': genre.color_primary
        })
    
    # Get year distribution
    year_stats = []
    years = Movie.objects.values_list('year', flat=True).distinct().order_by('-year')[:10]
    for year in years:
        count = Movie.objects.filter(year=year).count()
        year_stats.append({'year': year, 'count': count})
    
    return JsonResponse({
        'success': True,
        'stats': {
            'total_movies': total_movies,
            'local_movies': local_movies,
            'featured_movies': featured_movies,
            'genres': genre_stats,
            'years': year_stats
        }
    })


@require_http_methods(["POST"])
def provide_feedback(request):
    """Provide feedback on recommendations."""
    
    try:
        data = json.loads(request.body)
        session_token = data.get('session_token')
        movie_id = data.get('movie_id')
        action = data.get('action')  # 'liked', 'disliked', 'watched'
        
        if not all([session_token, movie_id, action]):
            return JsonResponse({
                'success': False,
                'message': 'Missing required parameters.'
            }, status=400)
        
        # Find the recommendation session
        try:
            session = RecommendationSession.objects.get(session_token=session_token)
        except RecommendationSession.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Invalid session token.'
            }, status=400)
        
        # Update user feedback
        feedback = session.user_feedback or []
        feedback.append({
            'movie_id': movie_id,
            'action': action,
            'timestamp': timezone.now().isoformat()
        })
        session.user_feedback = feedback
        session.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Feedback recorded successfully!'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data.'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500) 