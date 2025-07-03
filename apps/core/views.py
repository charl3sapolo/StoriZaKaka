from django.shortcuts import render

def home(request):
    # Example context, replace with real data as needed
    context = {
        "total_movies": 5000,
        "total_genres": 20,
        "active_users": "10K+",
        "popular_genres": [],  # Fill with Genre queryset
        "featured_movies": [], # Fill with Movie queryset
        "user_stats": {},
        "recent_recommendations": [],
    }
    return render(request, "pages/home.html", context)

def discover(request):
    return render(request, "pages/discover.html")