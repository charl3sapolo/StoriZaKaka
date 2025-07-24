from django.shortcuts import render

def home(request):
    return render(request, 'pages/home.html', {
        'page_title': 'Stori za Kaka',
        'is_home': True
    })