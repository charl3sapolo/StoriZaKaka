"""
Utility functions for the recommendation engine.
"""

def normalize_score(score, min_score=0, max_score=1):
    """Normalize a score to 0-1 range."""
    if max_score == min_score:
        return 0
    return (score - min_score) / (max_score - min_score)


def safe_divide(a, b):
    """Safely divide two numbers, return 0 if denominator is zero."""
    try:
        return a / b
    except ZeroDivisionError:
        return 0 