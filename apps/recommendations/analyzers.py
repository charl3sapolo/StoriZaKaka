"""
Text analysis utilities for mood detection and keyword extraction.
"""
import re

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

def detect_mood(text):
    """Detect mood/genre keywords from user input text."""
    text = text.lower()
    detected = set()
    for mood, keywords in MOOD_KEYWORDS.items():
        for keyword in keywords:
            if re.search(r'\b' + re.escape(keyword) + r'\b', text):
                detected.add(mood)
    return list(detected)


def extract_keywords(text):
    """Extract keywords from text (simple split, can be improved)."""
    return re.findall(r'\w+', text.lower()) 