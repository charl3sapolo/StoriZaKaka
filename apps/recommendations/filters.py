"""
Filter helpers for the recommendation engine.
"""

def filter_by_genres(queryset, genres):
    """Filter movies by a list of genre names."""
    if genres:
        return queryset.filter(genres__name__in=genres).distinct()
    return queryset


def filter_by_year_range(queryset, year_start=None, year_end=None):
    """Filter movies by year range."""
    if year_start:
        queryset = queryset.filter(year__gte=year_start)
    if year_end:
        queryset = queryset.filter(year__lte=year_end)
    return queryset


def filter_by_runtime(queryset, runtime_preference=None):
    """Filter movies by runtime preference ('short', 'medium', 'long')."""
    if runtime_preference == 'short':
        return queryset.filter(runtime__lte=90)
    elif runtime_preference == 'medium':
        return queryset.filter(runtime__gt=90, runtime__lte=120)
    elif runtime_preference == 'long':
        return queryset.filter(runtime__gt=120)
    return queryset


def filter_by_local(queryset, include_local=True):
    """Filter movies by local (Tanzanian/East African) flag."""
    if not include_local:
        return queryset.filter(is_local=False)
    return queryset 