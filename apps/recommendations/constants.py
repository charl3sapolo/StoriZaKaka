"""
Constants for the recommendation engine: genre mappings, mood keywords, etc.
"""

GENRE_MAPPINGS = {
    'action': 'Action',
    'comedy': 'Comedy',
    'drama': 'Drama',
    'romance': 'Romance',
    'thriller': 'Thriller',
    'sci-fi': 'Sci-Fi',
    'horror': 'Horror',
    'family': 'Family',
}

MOOD_KEYWORDS = {
    'action': ['action', 'exciting', 'adventure', 'fight', 'battle'],
    'comedy': ['funny', 'comedy', 'laugh', 'humor', 'hilarious'],
    'drama': ['drama', 'emotional', 'serious', 'deep', 'story'],
    'romance': ['romance', 'love', 'relationship', 'heart'],
    'thriller': ['thriller', 'suspense', 'mystery', 'crime'],
    'horror': ['horror', 'scary', 'fright', 'ghost', 'terror'],
    'sci-fi': ['sci-fi', 'science', 'future', 'space', 'alien'],
    'family': ['family', 'kids', 'children', 'friendly']
} 