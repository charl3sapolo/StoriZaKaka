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


@login_required
@require_http_methods(["GET"])
def get_user_movie_counts(request):
    """
    Get movie counts for user (for profile page display).
    Returns only counts, not full movie data.
    """
    try:
        from apps.core.models import SavedMovie, AnonymousSavedMovie
        from django.utils import timezone
        
        user = request.user
        
        # Get saved movies count
        saved_count = SavedMovie.objects.filter(user=user).count()
        
        # Get watch later count (movies marked as watch later)
        watch_later_count = SavedMovie.objects.filter(
            user=user, 
            is_watch_later=True
        ).count()
        
        return JsonResponse({
            'success': True,
            'counts': {
                'saved_count': saved_count,
                'watch_later_count': watch_later_count,
                'total_count': saved_count + watch_later_count
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Server error: {str(e)}'
        }, status=500)


@login_required
@require_http_methods(["GET"])
def get_user_movies(request):
    """
    Get full movie data for user (for movies page display).
    Returns complete movie objects with all details.
    """
    try:
        from apps.core.models import SavedMovie
        from django.db.models import Q
        import logging
        
        logger = logging.getLogger(__name__)
        
        user = request.user
        filter_type = request.GET.get('type', 'all')  # 'saved', 'watch_later', 'all'
        
        logger.info(f"🔍 Getting movies for user {user.username} with filter: {filter_type}")
        
        # Build query based on filter type
        if filter_type == 'saved':
            movies = SavedMovie.objects.filter(user=user, is_liked=True)
        elif filter_type == 'watch_later':
            movies = SavedMovie.objects.filter(user=user, is_watch_later=True)
        else:  # 'all'
            movies = SavedMovie.objects.filter(
                user=user
            ).filter(Q(is_liked=True) | Q(is_watch_later=True))
        
        # Order by most recently saved
        movies = movies.order_by('-saved_at')
        
        logger.info(f"📊 Found {movies.count()} movies for user {user.username}")
        
        movies_data = []
        for saved_movie in movies:
            movies_data.append({
                'id': saved_movie.id,
                'tmdb_id': saved_movie.tmdb_id,
                'title': saved_movie.title,
                'overview': saved_movie.overview,
                'poster_path': saved_movie.poster_path,
                'backdrop_path': saved_movie.backdrop_path,
                'release_date': saved_movie.release_date,
                'vote_average': saved_movie.vote_average,
                'vote_count': saved_movie.vote_count,
                'genre_ids': saved_movie.genre_ids,
                'media_type': saved_movie.media_type,
                'saved_at': saved_movie.saved_at.isoformat(),
                'is_liked': saved_movie.is_liked,
                'is_watch_later': saved_movie.is_watch_later,
                'poster_url': f"https://image.tmdb.org/t/p/w500{saved_movie.poster_path}" if saved_movie.poster_path else None,
                'backdrop_url': f"https://image.tmdb.org/t/p/original{saved_movie.backdrop_path}" if saved_movie.backdrop_path else None,
                'year': (saved_movie.release_date or '').split('-')[0] if saved_movie.release_date else 'N/A',
                'rating': f"{saved_movie.vote_average:.1f}" if saved_movie.vote_average else 'N/A'
            })
        
        logger.info(f"✅ Returning {len(movies_data)} movies for user {user.username}")
        
        return JsonResponse({
            'success': True,
            'movies': movies_data,
            'count': len(movies_data),
            'filter_type': filter_type
        })
        
    except Exception as e:
        logger.error(f"❌ Error getting movies for user {user.username}: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Server error: {str(e)}'
        }, status=500) 


@login_required
@require_http_methods(["POST"])
def save_movie_api(request):
    """
    API endpoint to save a movie for authenticated users.
    """
    try:
        import logging
        logger = logging.getLogger(__name__)
        
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
        
        logger.info(f"🎬 Saving movie: {title} (TMDB ID: {tmdb_id}) for user {request.user.username}")
        logger.info(f"📊 Movie data: {data}")
        
        if not tmdb_id or not title:
            logger.error(f"❌ Missing required fields: tmdb_id={tmdb_id}, title={title}")
            return JsonResponse({
                'success': False,
                'error': 'TMDB ID and title are required'
            }, status=400)
        
        from apps.core.models import SavedMovie
        
        # Check if movie already exists for this user
        existing_movie = SavedMovie.objects.filter(
            user=request.user,
            tmdb_id=tmdb_id,
            media_type=media_type
        ).first()
        
        if existing_movie:
            logger.info(f"✅ Movie already exists: {title} (ID: {existing_movie.id})")
            return JsonResponse({
                'success': True,
                'message': f'Movie "{title}" is already saved',
                'created': False,
                'movie_id': existing_movie.id
            })
        
        # Create new saved movie
        saved_movie = SavedMovie.objects.create(
            user=request.user,
            tmdb_id=tmdb_id,
            title=title,
            overview=overview,
            poster_path=poster_path,
            backdrop_path=backdrop_path,
            release_date=release_date,
            vote_average=vote_average,
            vote_count=vote_count,
            genre_ids=genre_ids,
            media_type=media_type,
            is_liked=True,  # Default to liked when saved
            is_watch_later=False
        )
        
        logger.info(f"✅ Successfully saved movie: {title} (ID: {saved_movie.id})")
        
        return JsonResponse({
            'success': True,
            'message': f'Movie "{title}" saved successfully',
            'created': True,
            'movie_id': saved_movie.id
        })
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ JSON decode error: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON payload'
        }, status=400)
    except Exception as e:
        logger.error(f"❌ Server error saving movie: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': f'Server error: {str(e)}'
        }, status=500) 