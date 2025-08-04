from mongoengine import Document
from django import forms
from .models import Movie

class MovieForm(forms.Form):
    title = forms.CharField(max_length=255, required=True)
    poster = forms.URLField(required=False)
    genre = forms.CharField(required=False, help_text='Comma-separated genres')
    rating = forms.FloatField(required=False)
    description = forms.CharField(widget=forms.Textarea, required=False)

    def save(self):
        genres = [g.strip() for g in self.cleaned_data['genre'].split(',') if g.strip()]
        movie = Movie(
            title=self.cleaned_data['title'],
            poster=self.cleaned_data['poster'],
            genre=genres,
            rating=self.cleaned_data['rating'],
            description=self.cleaned_data['description']
        )
        movie.save()
        return movie 