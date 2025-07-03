#!/usr/bin/env python3
"""
Database population script for Movie Recommender.
Creates sample data for development and testing.
"""

import os
import sys
import django
from datetime import datetime

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'movierecommender.settings.development')
django.setup()

from apps.core.models import Genre, Movie, User, UserWatchHistory
from django.contrib.auth import get_user_model

User = get_user_model()


def create_genres():
    """Create sample genres."""
    print("🎭 Creating genres...")
    
    genres_data = [
        {
            'name': 'Action',
            'name_sw': 'Vitendo',
            'description': 'High-energy films with exciting sequences',
            'description_sw': 'Filamu za nguvu na matukio ya kusisimua',
            'color_primary': '#EF4444',
            'color_secondary': '#FEE2E2',
            'icon_name': 'action',
            'is_active': True
        },
        {
            'name': 'Comedy',
            'name_sw': 'Vichekesho',
            'description': 'Humorous and entertaining films',
            'description_sw': 'Filamu za kusisimua na kufurahisha',
            'color_primary': '#F59E0B',
            'color_secondary': '#FEF3C7',
            'icon_name': 'comedy',
            'is_active': True
        },
        {
            'name': 'Drama',
            'name_sw': 'Tamthilia',
            'description': 'Serious and emotional storytelling',
            'description_sw': 'Hadithi za kujifunza na hisia',
            'color_primary': '#8B5CF6',
            'color_secondary': '#EDE9FE',
            'icon_name': 'drama',
            'is_active': True
        },
        {
            'name': 'Romance',
            'name_sw': 'Mapenzi',
            'description': 'Love stories and romantic relationships',
            'description_sw': 'Hadithi za mapenzi na mahusiano',
            'color_primary': '#EC4899',
            'color_secondary': '#FCE7F3',
            'icon_name': 'romance',
            'is_active': True
        },
        {
            'name': 'Thriller',
            'name_sw': 'Kusisimua',
            'description': 'Suspenseful and exciting films',
            'description_sw': 'Filamu za kusisimua na kufurahisha',
            'color_primary': '#374151',
            'color_secondary': '#F3F4F6',
            'icon_name': 'thriller',
            'is_active': True
        },
        {
            'name': 'Sci-Fi',
            'name_sw': 'Sayansi',
            'description': 'Science fiction and futuristic stories',
            'description_sw': 'Hadithi za sayansi na siku za usoni',
            'color_primary': '#06B6D4',
            'color_secondary': '#CFFAFE',
            'icon_name': 'sci-fi',
            'is_active': True
        },
        {
            'name': 'Horror',
            'name_sw': 'Kutisha',
            'description': 'Scary and frightening films',
            'description_sw': 'Filamu za kutisha na kuhofisha',
            'color_primary': '#7C3AED',
            'color_secondary': '#EDE9FE',
            'icon_name': 'horror',
            'is_active': True
        },
        {
            'name': 'Family',
            'name_sw': 'Familia',
            'description': 'Family-friendly entertainment',
            'description_sw': 'Burudani ya familia',
            'color_primary': '#10B981',
            'color_secondary': '#D1FAE5',
            'icon_name': 'family',
            'is_active': True
        }
    ]
    
    genres = {}
    for data in genres_data:
        genre, created = Genre.objects.get_or_create(
            name=data['name'],
            defaults=data
        )
        genres[data['name']] = genre
        if created:
            print(f"✅ Created genre: {data['name']}")
        else:
            print(f"⚠️  Genre already exists: {data['name']}")
    
    return genres


def create_movies(genres):
    """Create sample movies."""
    print("\n🎬 Creating movies...")
    
    movies_data = [
        {
            'title': 'The Lion King',
            'title_sw': 'Simba Mfalme',
            'year': 2019,
            'overview': 'After the murder of his father, a young lion prince flees his kingdom only to learn the true meaning of responsibility and bravery.',
            'overview_sw': 'Baada ya kuuawa kwa baba yake, mwana wa simba mdogo anakimbia ufalme wake lakini anajifunza maana ya jukumu na ujasiri.',
            'poster_path': 'https://image.tmdb.org/t/p/w500/2bXbqYdUdNVa8VIWXVfclP2ICtT.jpg',
            'backdrop_path': 'https://image.tmdb.org/t/p/original/1TUgZpJN2qgpBz89iRB9i8aTBGv.jpg',
            'runtime': 118,
            'genres': ['Family', 'Drama'],
            'tmdb_rating': 7.1,
            'imdb_rating': 6.9,
            'content_rating': 'G',
            'is_local': False,
            'is_featured': True
        },
        {
            'title': 'Black Panther',
            'title_sw': 'Chui Mweusi',
            'year': 2018,
            'overview': 'T\'Challa, heir to the hidden but advanced kingdom of Wakanda, must step forward to lead his people into a new future.',
            'overview_sw': 'T\'Challa, mrithi wa ufalme wa siri lakini wa maendeleo wa Wakanda, lazima atoke mbele kuongoza watu wake kuelekea siku za usoni.',
            'poster_path': 'https://image.tmdb.org/t/p/w500/uxzzxijgPIY7slzFvMotPv8wjKA.jpg',
            'backdrop_path': 'https://image.tmdb.org/t/p/original/6POBWybSBDBKjSs1VAQcnQC1qyt.jpg',
            'runtime': 134,
            'genres': ['Action', 'Sci-Fi'],
            'tmdb_rating': 7.3,
            'imdb_rating': 7.3,
            'content_rating': 'PG-13',
            'is_local': False,
            'is_featured': True
        },
        {
            'title': 'Parasite',
            'title_sw': 'Vimelea',
            'year': 2019,
            'overview': 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
            'overview_sw': 'Uchoyo na ubaguzi wa tabaka zinatishia uhusiano mpya wa ushirikiano kati ya familia tajiri ya Park na kabila maskini cha Kim.',
            'poster_path': 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
            'backdrop_path': 'https://image.tmdb.org/t/p/original/TU9dosjwH0uX4kqXpz8gqZ0OqjE.jpg',
            'runtime': 132,
            'genres': ['Drama', 'Thriller'],
            'tmdb_rating': 8.6,
            'imdb_rating': 8.5,
            'content_rating': 'R',
            'is_local': False,
            'is_featured': True
        },
        {
            'title': 'Jumanji: The Next Level',
            'title_sw': 'Jumanji: Kiwango Kifuatacho',
            'year': 2019,
            'overview': 'As the gang return to Jumanji to rescue one of their own, they discover that nothing is as they expect.',
            'overview_sw': 'Wakati kikundi kinarudi Jumanji kuokoa mmoja wao, wanagundua kuwa hakuna kitu kama wanavyotarajia.',
            'poster_path': 'https://image.tmdb.org/t/p/w500/bB42KDdfWkOvmzmYkmK58ZlCaYI.jpg',
            'backdrop_path': 'https://image.tmdb.org/t/p/original/5a4Jdo690zG06EfZCKX2MUpq7M8.jpg',
            'runtime': 123,
            'genres': ['Action', 'Comedy'],
            'tmdb_rating': 6.7,
            'imdb_rating': 6.7,
            'content_rating': 'PG-13',
            'is_local': False,
            'is_featured': False
        },
        {
            'title': 'Little Women',
            'title_sw': 'Wanawake Wadogo',
            'year': 2019,
            'overview': 'Four sisters come of age in America in the aftermath of the Civil War.',
            'overview_sw': 'Dada wanne wanakua huko Amerika baada ya Vita vya Wenyewe kwa Wenyewe.',
            'poster_path': 'https://image.tmdb.org/t/p/w500/yn5ihOD5Z7PrD8m5lWwvWkQn1Jk.jpg',
            'backdrop_path': 'https://image.tmdb.org/t/p/original/8moTOzunF7p40oR5XhlDvJckOSW.jpg',
            'runtime': 135,
            'genres': ['Drama', 'Romance'],
            'tmdb_rating': 7.8,
            'imdb_rating': 7.8,
            'content_rating': 'PG',
            'is_local': False,
            'is_featured': False
        },
        {
            'title': 'Usiku wa Mauti',
            'title_sw': 'Usiku wa Mauti',
            'year': 2020,
            'overview': 'A Tanzanian thriller about a mysterious night that changes everything.',
            'overview_sw': 'Filamu ya Tanzania ya kusisimua kuhusu usiku wa siri unaobadilisha kila kitu.',
            'poster_path': '',
            'backdrop_path': '',
            'runtime': 120,
            'genres': ['Thriller', 'Drama'],
            'tmdb_rating': None,
            'imdb_rating': None,
            'local_rating': 7.5,
            'content_rating': 'PG-13',
            'is_local': True,
            'is_featured': True
        },
        {
            'title': 'Mama Africa',
            'title_sw': 'Mama Africa',
            'year': 2021,
            'overview': 'A heartwarming story about family and tradition in modern Tanzania.',
            'overview_sw': 'Hadithi ya kujifurahisha kuhusu familia na mila katika Tanzania ya kisasa.',
            'poster_path': '',
            'backdrop_path': '',
            'runtime': 95,
            'genres': ['Drama', 'Family'],
            'tmdb_rating': None,
            'imdb_rating': None,
            'local_rating': 8.0,
            'content_rating': 'G',
            'is_local': True,
            'is_featured': False
        }
    ]
    
    for data in movies_data:
        # Get genre objects
        genre_objects = [genres[genre_name] for genre_name in data['genres']]
        
        # Create movie
        movie, created = Movie.objects.get_or_create(
            title=data['title'],
            year=data['year'],
            defaults={
                'title_sw': data['title_sw'],
                'overview': data['overview'],
                'overview_sw': data['overview_sw'],
                'poster_path': data['poster_path'],
                'backdrop_path': data['backdrop_path'],
                'runtime': data['runtime'],
                'tmdb_rating': data['tmdb_rating'],
                'imdb_rating': data['imdb_rating'],
                'local_rating': data.get('local_rating'),
                'content_rating': data['content_rating'],
                'is_local': data['is_local'],
                'is_featured': data['is_featured']
            }
        )
        
        # Add genres
        movie.genres.set(genre_objects)
        
        if created:
            print(f"✅ Created movie: {data['title']} ({data['year']})")
        else:
            print(f"⚠️  Movie already exists: {data['title']} ({data['year']})")


def create_sample_users():
    """Create sample users for testing."""
    print("\n👥 Creating sample users...")
    
    users_data = [
        {
            'username': 'demo_user',
            'email': 'demo@example.com',
            'password': 'demo123456',
            'first_name': 'Demo',
            'last_name': 'User',
            'language': 'en',
            'theme': 'auto'
        },
        {
            'username': 'mtumiaji_mfano',
            'email': 'mfano@example.com',
            'password': 'mfano123456',
            'first_name': 'Mtumiaji',
            'last_name': 'Mfano',
            'language': 'sw',
            'theme': 'light'
        }
    ]
    
    for data in users_data:
        user, created = User.objects.get_or_create(
            username=data['username'],
            defaults={
                'email': data['email'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'language': data['language'],
                'theme': data['theme']
            }
        )
        
        if created:
            user.set_password(data['password'])
            user.save()
            print(f"✅ Created user: {data['username']} (password: {data['password']})")
        else:
            print(f"⚠️  User already exists: {data['username']}")


def create_sample_ratings():
    """Create sample user ratings."""
    print("\n⭐ Creating sample ratings...")
    
    # Get demo user
    try:
        demo_user = User.objects.get(username='demo_user')
        movies = Movie.objects.all()[:5]  # Rate first 5 movies
        
        for i, movie in enumerate(movies):
            rating = 4 if i % 2 == 0 else 5  # Alternate between 4 and 5 stars
            watch_history, created = UserWatchHistory.objects.get_or_create(
                user=demo_user,
                movie=movie,
                defaults={
                    'rating': rating,
                    'notes': f'Sample rating for {movie.title}'
                }
            )
            
            if created:
                print(f"✅ Rated {movie.title}: {rating} stars")
            else:
                print(f"⚠️  Rating already exists for {movie.title}")
                
    except User.DoesNotExist:
        print("⚠️  Demo user not found, skipping ratings")


def main():
    """Main function to populate database."""
    print("🗄️  Populating Movie Recommender Database")
    print("=" * 50)
    
    # Create genres
    genres = create_genres()
    
    # Create movies
    create_movies(genres)
    
    # Create sample users
    create_sample_users()
    
    # Create sample ratings
    create_sample_ratings()
    
    print("\n🎉 Database population completed!")
    print(f"\nCreated:")
    print(f"- {Genre.objects.count()} genres")
    print(f"- {Movie.objects.count()} movies")
    print(f"- {User.objects.count()} users")
    print(f"- {UserWatchHistory.objects.count()} ratings")
    
    print("\nYou can now:")
    print("1. Run: python manage.py runserver")
    print("2. Visit: http://localhost:8000")
    print("3. Login with demo_user/demo123456 or mtumiaji_mfano/mfano123456")


if __name__ == "__main__":
    main() 