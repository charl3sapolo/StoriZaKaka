import os
import requests
from typing import Optional, Dict, Any

TMDB_API_KEY = os.environ.get('TMDB_API_KEY', 'b6e814a0b9ff291122e8a05a0f206cd8')
TMDB_BASE_URL = 'https://api.themoviedb.org/3'

class TMDBApiError(Exception):
    pass

def tmdb_search_movies(query: str, params: Optional[Dict[str, Any]] = None) -> dict:
    url = f"{TMDB_BASE_URL}/search/movie"
    headers = {"Authorization": f"Bearer {TMDB_API_KEY}"}
    payload = {"query": query, "api_key": TMDB_API_KEY}
    if params:
        payload.update(params)
    try:
        response = requests.get(url, params=payload)
        if response.status_code == 429:
            raise TMDBApiError("TMDB API rate limit exceeded.")
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise TMDBApiError(f"TMDB API error: {e}")

def tmdb_get_movie_details(tmdb_id: int) -> dict:
    url = f"{TMDB_BASE_URL}/movie/{tmdb_id}"
    payload = {"api_key": TMDB_API_KEY}
    try:
        response = requests.get(url, params=payload)
        if response.status_code == 429:
            raise TMDBApiError("TMDB API rate limit exceeded.")
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise TMDBApiError(f"TMDB API error: {e}") 