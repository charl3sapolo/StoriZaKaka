"""
Core recommendation engine for the Movie Recommender application.
"""

from __future__ import annotations
import math
import time
from typing import List, Dict, Any, Optional
from django.db.models import Q, Avg, Count
from django.contrib.auth import get_user_model
from apps.core.models import Movie, Genre, UserWatchHistory, RecommendationSession, RecommendationResult
from django.utils import timezone
from django.db.models.query import QuerySet

User = get_user_model()


class RecommendationEngine:
    """Main recommendation engine implementing hybrid filtering."""
    
    def __init__(self):
        self.user_similarity_cache = {}
        self.movie_similarity_cache = {}
    
    def get_recommendations(
        self,
        user: Optional["User"] = None,
        session_token: Optional[str] = None,
        genres: List[str] = None,
        mood_text: str = None,
        year_start: int = None,
        year_end: int = None,
        runtime_preference: str = None,
        include_local: bool = True,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Get movie recommendations based on various criteria.
        
        Args:
            user: Authenticated user (optional)
            session_token: Guest session token (optional)
            genres: List of genre names to filter by
            mood_text: Text describing desired mood
            year_start: Start year for filtering
            year_end: End year for filtering
            runtime_preference: 'short', 'medium', or 'long'
            include_local: Whether to include local movies
            limit: Maximum number of recommendations
            
        Returns:
            List of movie recommendations with scores and reasons
        """
        # Start with base queryset
        queryset = Movie.objects.all()
        
        # Apply filters
        queryset = self._apply_filters(
            queryset, genres, year_start, year_end, 
            runtime_preference, include_local
        )
        
        # Get recommendations based on user type
        if user and user.is_authenticated:
            recommendations = self._get_user_recommendations(user, queryset, limit)
        else:
            recommendations = self._get_guest_recommendations(
                queryset, mood_text, limit
            )
        
        # Create or update recommendation session
        session = self._create_recommendation_session(
            user, session_token, genres, mood_text, 
            year_start, year_end, runtime_preference, include_local
        )
        
        # Save results
        self._save_recommendation_results(session, recommendations)
        
        return recommendations
    
    def get_user_recommendations(
        self, 
        user: "User", 
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get personalized recommendations for authenticated user."""
        return self._get_user_recommendations(user, Movie.objects.all(), limit)
    
    def get_similar_movies(
        self, 
        movie: "Movie", 
        limit: int = 6
    ) -> List[Dict[str, Any]]:
        """Get movies similar to a given movie."""
        similar_movies = []
        
        # Get movies with similar genres
        genre_ids = movie.genres.values_list('id', flat=True)
        similar_queryset = Movie.objects.filter(
            genres__id__in=genre_ids
        ).exclude(id=movie.id).distinct()
        
        for similar_movie in similar_queryset[:limit * 2]:
            similarity_score = self._calculate_movie_similarity(movie, similar_movie)
            if similarity_score > 0.3:  # Minimum similarity threshold
                similar_movies.append({
                    'movie': similar_movie,
                    'score': similarity_score,
                    'reasons': self._get_similarity_reasons(movie, similar_movie)
                })
        
        # Sort by similarity score and return top results
        similar_movies.sort(key=lambda x: x['score'], reverse=True)
        return similar_movies[:limit]
    
    def _get_user_recommendations(
        self, 
        user: "User", 
        queryset: QuerySet["Movie"], 
        limit: int
    ) -> List[Dict[str, Any]]:
        """Get personalized recommendations for authenticated user."""
        recommendations = []
        
        # Get user's watch history and preferences
        user_ratings = UserWatchHistory.objects.filter(user=user)
        rated_movie_ids = user_ratings.values_list('movie_id', flat=True)
        
        # Exclude already rated movies
        queryset = queryset.exclude(id__in=rated_movie_ids)
        
        # Get user's favorite genres
        favorite_genres = self._get_user_favorite_genres(user)
        
        # Calculate recommendation scores
        for movie in queryset[:limit * 3]:  # Get more candidates for better selection
            score = 0
            reasons = []
            
            # Content-based scoring
            content_score = self._calculate_content_score(movie, user, favorite_genres)
            score += content_score * 0.6
            if content_score > 0.5:
                reasons.append("Matches your favorite genres")
            
            # Collaborative filtering score
            if user_ratings.count() > 5:  # Need minimum ratings for collaborative filtering
                collab_score = self._calculate_collaborative_score(movie, user)
                score += collab_score * 0.4
                if collab_score > 0.5:
                    reasons.append("Liked by users with similar taste")
            
            # Local movie bonus
            if movie.is_local and user.include_local_movies:
                score += 0.2
                reasons.append("Local Tanzanian movie")
            
            # Year preference
            year_score = self._calculate_year_preference(movie, user)
            score += year_score * 0.1
            
            if score > 0.3:  # Minimum score threshold
                recommendations.append({
                    'movie': movie,
                    'score': score,
                    'reasons': reasons
                })
        
        # Sort by score and return top results
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations[:limit]
    
    def _get_guest_recommendations(
        self, 
        queryset: QuerySet["Movie"], 
        mood_text: str, 
        limit: int
    ) -> List[Dict[str, Any]]:
        """Get recommendations for guest users based on mood and popularity."""
        recommendations = []
        
        # Analyze mood text if provided
        mood_keywords = self._analyze_mood_text(mood_text) if mood_text else []
        
        for movie in queryset[:limit * 2]:
            score = 0
            reasons = []
            
            # Popularity score
            popularity_score = self._calculate_popularity_score(movie)
            score += popularity_score * 0.5
            if popularity_score > 0.7:
                reasons.append("Highly rated by users")
            
            # Mood matching
            if mood_keywords:
                mood_score = self._calculate_mood_score(movie, mood_keywords)
                score += mood_score * 0.5
                if mood_score > 0.5:
                    reasons.append("Matches your mood")
            
            # Featured movie bonus
            if movie.is_featured:
                score += 0.3
                reasons.append("Featured movie")
            
            if score > 0.3:
                recommendations.append({
                    'movie': movie,
                    'score': score,
                    'reasons': reasons
                })
        
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations[:limit]
    
    def _apply_filters(
        self, 
        queryset: QuerySet["Movie"], 
        genres: List[str], 
        year_start: int, 
        year_end: int, 
        runtime_preference: str, 
        include_local: bool
    ) -> QuerySet["Movie"]:
        """Apply various filters to the movie queryset."""
        
        # Genre filter
        if genres:
            queryset = queryset.filter(genres__name__in=genres).distinct()
        
        # Year filter
        if year_start:
            queryset = queryset.filter(year__gte=year_start)
        if year_end:
            queryset = queryset.filter(year__lte=year_end)
        
        # Runtime filter
        if runtime_preference:
            if runtime_preference == 'short':
                queryset = queryset.filter(runtime__lte=90)
            elif runtime_preference == 'medium':
                queryset = queryset.filter(runtime__gt=90, runtime__lte=120)
            elif runtime_preference == 'long':
                queryset = queryset.filter(runtime__gt=120)
        
        # Local movies filter
        if not include_local:
            queryset = queryset.filter(is_local=False)
        
        return queryset
    
    def _get_user_favorite_genres(self, user: "User") -> List[str]:
        """Get user's favorite genres based on watch history."""
        user_ratings = UserWatchHistory.objects.filter(
            user=user, 
            rating__gte=4
        ).select_related('movie')
        
        genre_counts = {}
        for rating in user_ratings:
            for genre in rating.movie.genres.all():
                genre_counts[genre.name] = genre_counts.get(genre.name, 0) + 1
        
        # Return top 3 favorite genres
        return sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    
    def _calculate_content_score(
        self, 
        movie: "Movie", 
        user: "User", 
        favorite_genres: List[tuple]
    ) -> float:
        """Calculate content-based recommendation score."""
        score = 0
        
        # Genre matching
        movie_genres = set(movie.genres.values_list('name', flat=True))
        for genre_name, count in favorite_genres:
            if genre_name in movie_genres:
                score += count * 0.3
        
        # Rating quality
        if movie.tmdb_rating:
            score += (movie.tmdb_rating / 10) * 0.2
        
        return min(score, 1.0)
    
    def _calculate_collaborative_score(self, movie: "Movie", user: "User") -> float:
        """Calculate collaborative filtering score."""
        # Find similar users
        similar_users = self._find_similar_users(user)
        
        if not similar_users:
            return 0
        
        # Calculate average rating from similar users
        total_rating = 0
        rating_count = 0
        
        for similar_user, similarity in similar_users:
            try:
                rating = UserWatchHistory.objects.get(
                    user=similar_user, 
                    movie=movie
                ).rating
                if rating:
                    total_rating += rating * similarity
                    rating_count += similarity
            except UserWatchHistory.DoesNotExist:
                continue
        
        if rating_count > 0:
            return (total_rating / rating_count) / 5  # Normalize to 0-1
        return 0
    
    def _find_similar_users(self, user: "User") -> List[tuple]:
        """Find users with similar taste."""
        if user.id in self.user_similarity_cache:
            return self.user_similarity_cache[user.id]
        
        user_ratings = UserWatchHistory.objects.filter(user=user)
        similar_users = []
        
        # Get all other users who rated the same movies
        other_users = User.objects.exclude(id=user.id)
        
        for other_user in other_users:
            similarity = self._calculate_user_similarity(user, other_user)
            if similarity > 0.3:  # Minimum similarity threshold
                similar_users.append((other_user, similarity))
        
        # Sort by similarity and cache results
        similar_users.sort(key=lambda x: x[1], reverse=True)
        self.user_similarity_cache[user.id] = similar_users[:10]
        
        return self.user_similarity_cache[user.id]
    
    def _calculate_user_similarity(self, user1: "User", user2: "User") -> float:
        """Calculate similarity between two users using Pearson correlation."""
        # Get movies rated by both users
        user1_ratings = UserWatchHistory.objects.filter(user=user1)
        user2_ratings = UserWatchHistory.objects.filter(user=user2)
        
        # Find common movies
        user1_movies = {r.movie_id: r.rating for r in user1_ratings if r.rating}
        user2_movies = {r.movie_id: r.rating for r in user2_ratings if r.rating}
        
        common_movies = set(user1_movies.keys()) & set(user2_movies.keys())
        
        if len(common_movies) < 3:  # Need minimum common movies
            return 0
        
        # Calculate Pearson correlation
        n = len(common_movies)
        sum1 = sum(user1_movies[movie_id] for movie_id in common_movies)
        sum2 = sum(user2_movies[movie_id] for movie_id in common_movies)
        sum1_sq = sum(user1_movies[movie_id] ** 2 for movie_id in common_movies)
        sum2_sq = sum(user2_movies[movie_id] ** 2 for movie_id in common_movies)
        p_sum = sum(user1_movies[movie_id] * user2_movies[movie_id] for movie_id in common_movies)
        
        num = p_sum - (sum1 * sum2 / n)
        den = math.sqrt((sum1_sq - sum1 ** 2 / n) * (sum2_sq - sum2 ** 2 / n))
        
        if den == 0:
            return 0
        
        return max(0, num / den)  # Return non-negative similarity
    
    def _calculate_popularity_score(self, movie: "Movie") -> float:
        """Calculate popularity score based on ratings and watch count."""
        score = 0
        
        # Rating score
        if movie.tmdb_rating:
            score += (movie.tmdb_rating / 10) * 0.6
        
        # Watch count score
        watch_count = UserWatchHistory.objects.filter(movie=movie).count()
        if watch_count > 0:
            score += min(watch_count / 100, 1.0) * 0.4
        
        return score
    
    def _analyze_mood_text(self, mood_text: str) -> List[str]:
        """Analyze mood text and extract keywords."""
        # Simple keyword extraction - in production, use NLP libraries
        mood_keywords = []
        mood_text_lower = mood_text.lower()
        
        mood_mappings = {
            'action': ['action', 'exciting', 'thrilling', 'adventure'],
            'comedy': ['funny', 'humorous', 'comedy', 'laugh'],
            'drama': ['dramatic', 'emotional', 'serious', 'deep'],
            'romance': ['romantic', 'love', 'romance', 'relationship'],
            'thriller': ['suspense', 'thrilling', 'mystery', 'crime'],
            'horror': ['scary', 'horror', 'frightening', 'terrifying'],
            'sci-fi': ['sci-fi', 'science fiction', 'futuristic', 'space'],
            'family': ['family', 'kids', 'children', 'friendly']
        }
        
        for genre, keywords in mood_mappings.items():
            if any(keyword in mood_text_lower for keyword in keywords):
                mood_keywords.append(genre)
        
        return mood_keywords
    
    def _calculate_mood_score(self, movie: "Movie", mood_keywords: List[str]) -> float:
        """Calculate how well a movie matches given mood keywords."""
        if not mood_keywords:
            return 0
        
        movie_genres = set(movie.genres.values_list('name', flat=True))
        matches = sum(1 for keyword in mood_keywords if keyword in movie_genres)
        
        return matches / len(mood_keywords)
    
    def _calculate_year_preference(self, movie: "Movie", user: "User") -> float:
        """Calculate year preference score based on user's watch history."""
        user_movies = UserWatchHistory.objects.filter(user=user).select_related('movie')
        
        if not user_movies:
            return 0
        
        # Calculate average year of user's watched movies
        avg_year = sum(rating.movie.year for rating in user_movies) / len(user_movies)
        
        # Score based on how close the movie year is to user's preference
        year_diff = abs(movie.year - avg_year)
        if year_diff <= 5:
            return 0.2
        elif year_diff <= 10:
            return 0.1
        else:
            return 0
    
    def _calculate_movie_similarity(self, movie1: "Movie", movie2: "Movie") -> float:
        """Calculate similarity between two movies."""
        cache_key = tuple(sorted([movie1.id, movie2.id]))
        
        if cache_key in self.movie_similarity_cache:
            return self.movie_similarity_cache[cache_key]
        
        # Genre similarity
        genres1 = set(movie1.genres.values_list('name', flat=True))
        genres2 = set(movie2.genres.values_list('name', flat=True))
        
        if not genres1 or not genres2:
            similarity = 0
        else:
            intersection = len(genres1 & genres2)
            union = len(genres1 | genres2)
            similarity = intersection / union if union > 0 else 0
        
        # Year similarity (closer years = higher similarity)
        year_diff = abs(movie1.year - movie2.year)
        year_similarity = max(0, 1 - (year_diff / 50))  # 50 years = 0 similarity
        
        # Combine similarities
        final_similarity = (similarity * 0.7) + (year_similarity * 0.3)
        
        self.movie_similarity_cache[cache_key] = final_similarity
        return final_similarity
    
    def _get_similarity_reasons(self, movie1: "Movie", movie2: "Movie") -> List[str]:
        """Get reasons why two movies are similar."""
        reasons = []
        
        # Genre reasons
        genres1 = set(movie1.genres.values_list('name', flat=True))
        genres2 = set(movie2.genres.values_list('name', flat=True))
        common_genres = genres1 & genres2
        
        if common_genres:
            reasons.append(f"Both are {', '.join(common_genres)} movies")
        
        # Year reason
        year_diff = abs(movie1.year - movie2.year)
        if year_diff <= 5:
            reasons.append("From the same era")
        
        return reasons
    
    def _create_recommendation_session(
        self,
        user: Optional["User"],
        session_token: Optional[str],
        genres: List[str],
        mood_text: str,
        year_start: int,
        year_end: int,
        runtime_preference: str,
        include_local: bool
    ) -> "RecommendationSession":
        """Create or update recommendation session."""
        if session_token:
            session, created = RecommendationSession.objects.get_or_create(
                session_token=session_token,
                defaults={
                    'user': user,
                    'genres': genres or [],
                    'mood_text': mood_text or '',
                    'year_start': year_start,
                    'year_end': year_end,
                    'runtime_preference': runtime_preference or '',
                    'include_local': include_local
                }
            )
        else:
            session = RecommendationSession.objects.create(
                user=user,
                session_token=f"session_{user.id if user else 'guest'}_{int(time.time())}",
                genres=genres or [],
                mood_text=mood_text or '',
                year_start=year_start,
                year_end=year_end,
                runtime_preference=runtime_preference or '',
                include_local=include_local
            )
        
        return session
    
    def _save_recommendation_results(
        self, 
        session: "RecommendationSession", 
        recommendations: List[Dict[str, Any]]
    ):
        """Save recommendation results to database."""
        # Clear existing results
        RecommendationResult.objects.filter(session=session).delete()
        
        # Save new results
        for rec in recommendations:
            RecommendationResult.objects.create(
                session=session,
                movie=rec['movie'],
                score=rec['score'],
                reasons=rec['reasons']
            ) 