import os
import requests
from django.core.management.base import BaseCommand
from apps.core.models import Movie, Genre
from django.db import transaction
from pymongo import MongoClient

TMDB_API_KEY = os.environ.get('TMDB_API_KEY', 'b6e814a0b9ff291122e8a05a0f206cd8')
TMDB_BASE_URL = 'https://api.themoviedb.org/3'

# MongoDB setup (replace with your actual URI and DB/collection names)
mongo_client = MongoClient("mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority")
mongo_db = mongo_client["movieDB"]
mongo_collection = mongo_db["movies"]
exit()
class Command(BaseCommand):
    help = 'Import movies and genres from TMDb into the local database.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Fetching genres from TMDb...'))
        genres = self.fetch_genres()
        genre_map = {}
        for g in genres:
            obj, _ = Genre.objects.get_or_create(
                name=g['name'],
                defaults={
                    'name_sw': g['name'],
                    'icon_name': '',
                    'emoji': '',
                    'color_primary': '#888888',
                }
            )
            genre_map[g['id']] = obj
        self.stdout.write(self.style.SUCCESS(f'Imported {len(genre_map)} genres.'))

        self.stdout.write(self.style.NOTICE('Fetching popular movies from TMDb...'))
        imported = 0
        for page in range(1, 3):  # Fetch first 2 pages (40 movies)
            movies = self.fetch_movies(page)
            for m in movies:
                with transaction.atomic():
                    movie, created = Movie.objects.get_or_create(
                        title=m.get('title') or m.get('name') or 'Untitled',
                        defaults={
                            # Add more fields as needed
                        }
                    )
                    # Set year
                    if m.get('release_date'):
                        try:
                            movie.year = int(m['release_date'][:4])
                        except Exception:
                            pass
                    # Set poster
                    if m.get('poster_path'):
                        movie.poster_path = m['poster_path']
                    # Set overview
                    if m.get('overview'):
                        movie.overview = m['overview']
                    # Set rating
                    if m.get('vote_average'):
                        movie.tmdb_rating = m['vote_average']
                    # Set genres
                    movie.save()
                    if m.get('genre_ids'):
                        movie.genres.set([genre_map[g] for g in m['genre_ids'] if g in genre_map])
                    movie.save()
                    imported += int(created)

                    # Prepare movie data for MongoDB (customize fields as needed)
                    mongo_movie = {
                        "title": m.get('title') or m.get('name') or 'Untitled',
                        "year": int(m['release_date'][:4]) if m.get('release_date') else None,
                        "poster_path": m.get('poster_path'),
                        "overview": m.get('overview'),
                        "tmdb_rating": m.get('vote_average'),
                        "genre_ids": m.get('genre_ids', []),
                        # Add more fields as needed
                    }
                    mongo_collection.update_one(
                        {"title": mongo_movie["title"], "year": mongo_movie["year"]},
                        {"$set": mongo_movie},
                        upsert=True
                    )

        self.stdout.write(self.style.SUCCESS(f'Imported {imported} new movies.'))

    def fetch_genres(self):
        url = f'{TMDB_BASE_URL}/genre/movie/list?api_key={TMDB_API_KEY}&language=en-US'
        r = requests.get(url)
        r.raise_for_status()
        return r.json().get('genres', [])

    def fetch_movies(self, page=1):
        url = f'{TMDB_BASE_URL}/movie/popular?api_key={TMDB_API_KEY}&language=en-US&page={page}'
        r = requests.get(url)
        r.raise_for_status()
        return r.json().get('results', [])