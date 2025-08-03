// Movie Manager - Handles saved movies functionality
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = window.TMDB_API_KEY || 'your-api-key-here';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

class MovieManager {
  constructor() {
    this.savedMovies = [];
    this.watchLaterMovies = [];
    this.isLoggedIn = this.checkIfLoggedIn();
    this.sessionId = this.getSessionId();
    this.init();
  }

  async init() {
    // Use enhanced loading for better saved movies display
    await this.loadSavedMoviesEnhanced();
    this.setupEventListeners();
    this.updateCounts();
  }

  checkIfLoggedIn() {
    const userIndicator = document.querySelector('[data-user-id]');
    return userIndicator && userIndicator.getAttribute('data-user-id') !== '';
  }

  getSessionId() {
    let sessionId = localStorage.getItem('movieSessionId');
    if (!sessionId) {
      sessionId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('movieSessionId', sessionId);
    }
    return sessionId;
  }

  async loadSavedMovies() {
    try {
      if (this.isLoggedIn) {
        // Load from database for logged-in users
        const response = await fetch(`/api/saved-movies/?is_logged_in=true`, {
          headers: {
            'X-CSRFToken': this.getCSRFToken()
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.savedMovies = data.movies || [];
        }
      } else {
        // Load from localStorage for anonymous users
        const savedMovies = JSON.parse(localStorage.getItem('savedMovies') || '[]');
        
        // Clean up expired movies
        const now = new Date();
        const validMovies = savedMovies.filter(movie => {
          if (!movie.expires_at) return true;
          return new Date(movie.expires_at) > now;
        });
        
        this.savedMovies = validMovies;
        localStorage.setItem('savedMovies', JSON.stringify(validMovies));
      }

      this.displayMovies();
    } catch (error) {
      console.error('Error loading saved movies:', error);
      this.showError('Failed to load saved movies');
    }
  }

  displayMovies() {
    const savedGrid = document.getElementById('savedMoviesGrid');
    const watchLaterGrid = document.getElementById('watchLaterGrid');
    const savedEmptyState = document.getElementById('savedEmptyState');
    const watchLaterEmptyState = document.getElementById('watchLaterEmptyState');

    // Filter movies by category
    const savedMovies = this.savedMovies.filter(movie => !movie.is_watch_later);
    const watchLaterMovies = this.savedMovies.filter(movie => movie.is_watch_later);

    // Display saved movies
    if (savedMovies.length > 0) {
      savedGrid.innerHTML = '';
      savedMovies.forEach(movie => {
        const card = this.createMovieCard(movie);
        savedGrid.appendChild(card);
      });
      savedEmptyState.style.display = 'none';
    } else {
      savedGrid.innerHTML = '';
      savedEmptyState.style.display = 'block';
    }

    // Display watch later movies
    if (watchLaterMovies.length > 0) {
      watchLaterGrid.innerHTML = '';
      watchLaterMovies.forEach(movie => {
        const card = this.createMovieCard(movie);
        watchLaterGrid.appendChild(card);
      });
      watchLaterEmptyState.style.display = 'none';
    } else {
      watchLaterGrid.innerHTML = '';
      watchLaterEmptyState.style.display = 'block';
    }

    this.updateCounts();
  }

  createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('data-movie-id', movie.id || movie.tmdb_id);
    
    const posterPath = movie.poster_path ? 
      `${TMDB_IMAGE_BASE}${movie.poster_path}` : 
      '/static/logo.kakaflix.jpg';

    card.innerHTML = `
      <img src="${posterPath}" alt="${movie.title}" class="movie-poster" 
           onerror="this.src='/static/logo.kakaflix.jpg'">
      <div class="movie-info">
        <h3 class="movie-title">${movie.title}</h3>
        <div class="movie-meta">
          <span class="movie-year">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
          <span class="movie-rating">
            <i class="fas fa-star"></i>
            ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
          </span>
        </div>
      </div>
      <button class="remove-btn" onclick="movieManager.removeMovie(${movie.id || movie.tmdb_id})" title="Remove movie">
        <i class="fas fa-times"></i>
      </button>
      <div class="movie-actions" style="padding: 10px; display: flex; gap: 5px;">
        <button class="action-btn" onclick="movieManager.toggleLike(${movie.id || movie.tmdb_id})" 
                style="background: ${movie.is_liked ? 'var(--primary)' : 'transparent'}; color: ${movie.is_liked ? 'var(--dark)' : 'var(--text-secondary)'}; border: 1px solid var(--text-secondary); padding: 5px 10px; border-radius: 4px; font-size: 0.8rem;">
          <i class="fas fa-heart"></i> ${movie.is_liked ? 'Liked' : 'Like'}
        </button>
        <button class="action-btn" onclick="movieManager.toggleWatchLater(${movie.id || movie.tmdb_id})" 
                style="background: ${movie.is_watch_later ? 'var(--primary)' : 'transparent'}; color: ${movie.is_watch_later ? 'var(--dark)' : 'var(--text-secondary)'}; border: 1px solid var(--text-secondary); padding: 5px 10px; border-radius: 4px; font-size: 0.8rem;">
          <i class="fas fa-clock"></i> ${movie.is_watch_later ? 'Watch Later' : 'Add to Watch Later'}
        </button>
      </div>
    `;

    return card;
  }

  async removeMovie(movieId) {
    try {
      if (this.isLoggedIn) {
        // Remove from database
        const response = await fetch(`/api/remove-movie/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.getCSRFToken()
          },
          body: JSON.stringify({ movie_id: movieId })
        });

        if (!response.ok) {
          throw new Error('Failed to remove movie from database');
        }
      } else {
        // Remove from localStorage
        const savedMovies = JSON.parse(localStorage.getItem('savedMovies') || '[]');
        const updatedMovies = savedMovies.filter(movie => movie.tmdb_id !== movieId);
        localStorage.setItem('savedMovies', JSON.stringify(updatedMovies));
      }

      // Remove from local array
      this.savedMovies = this.savedMovies.filter(movie => 
        (movie.id || movie.tmdb_id) !== movieId
      );

      this.displayMovies();
      this.showSuccess('Movie removed successfully');
    } catch (error) {
      console.error('Error removing movie:', error);
      this.showError('Failed to remove movie');
    }
  }

  async toggleLike(movieId) {
    const movie = this.savedMovies.find(m => (m.id || m.tmdb_id) === movieId);
    if (!movie) return;

    const newLikeStatus = !movie.is_liked;
    
    try {
      if (this.isLoggedIn) {
        // Update in database
        const response = await fetch(`/api/update-movie-status/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.getCSRFToken()
          },
          body: JSON.stringify({
            movie_id: movieId,
            is_liked: newLikeStatus,
            is_watch_later: movie.is_watch_later,
            is_logged_in: true
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update movie status');
        }
      } else {
        // Update in localStorage
        const savedMovies = JSON.parse(localStorage.getItem('savedMovies') || '[]');
        const movieIndex = savedMovies.findIndex(m => m.tmdb_id === movieId);
        
        if (movieIndex >= 0) {
          savedMovies[movieIndex].is_liked = newLikeStatus;
          localStorage.setItem('savedMovies', JSON.stringify(savedMovies));
        }
      }

      // Update local array
      movie.is_liked = newLikeStatus;
      this.displayMovies();
      
      const message = newLikeStatus ? 'Movie liked!' : 'Movie unliked!';
      this.showSuccess(message);
    } catch (error) {
      console.error('Error updating movie like status:', error);
      this.showError('Failed to update movie status');
    }
  }

  async toggleWatchLater(movieId) {
    const movie = this.savedMovies.find(m => (m.id || m.tmdb_id) === movieId);
    if (!movie) return;

    const newWatchLaterStatus = !movie.is_watch_later;
    
    try {
      if (this.isLoggedIn) {
        // Update in database
        const response = await fetch(`/api/update-movie-status/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.getCSRFToken()
          },
          body: JSON.stringify({
            movie_id: movieId,
            is_liked: movie.is_liked,
            is_watch_later: newWatchLaterStatus,
            is_logged_in: true
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update movie status');
        }
      } else {
        // Update in localStorage
        const savedMovies = JSON.parse(localStorage.getItem('savedMovies') || '[]');
        const movieIndex = savedMovies.findIndex(m => m.tmdb_id === movieId);
        
        if (movieIndex >= 0) {
          savedMovies[movieIndex].is_watch_later = newWatchLaterStatus;
          localStorage.setItem('savedMovies', JSON.stringify(savedMovies));
        }
      }

      // Update local array
      movie.is_watch_later = newWatchLaterStatus;
      this.displayMovies();
      
      const message = newWatchLaterStatus ? 'Added to watch later!' : 'Removed from watch later!';
      this.showSuccess(message);
    } catch (error) {
      console.error('Error updating movie watch later status:', error);
      this.showError('Failed to update movie status');
    }
  }

  updateCounts() {
    const totalCount = this.savedMovies.length;
    const savedCount = this.savedMovies.filter(movie => !movie.is_watch_later).length;
    const watchLaterCount = this.savedMovies.filter(movie => movie.is_watch_later).length;

    // Update badge counts
    const savedCountElement = document.getElementById('savedCount');
    const mobileSavedCountElement = document.getElementById('mobileSavedCount');
    
    if (savedCountElement) savedCountElement.textContent = totalCount;
    if (mobileSavedCountElement) mobileSavedCountElement.textContent = totalCount;
  }

  getCSRFToken() {
    const token = document.querySelector('[name=csrfmiddlewaretoken]');
    return token ? token.value : '';
  }

  showSuccess(message) {
    this.showToast(message, 'success');
  }

  showError(message) {
    this.showToast(message, 'error');
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}-toast`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 300px;
    `;
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
      <span style="margin-left: 8px;">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  setupEventListeners() {
    // Auto-refresh saved movies every 30 seconds
    setInterval(() => {
      this.loadSavedMovies();
    }, 30000);
  }

  // ENHANCED SAVED MOVIES DISPLAY FUNCTIONS
  async loadSavedMoviesEnhanced() {
    const savedMovies = JSON.parse(localStorage.getItem('user_saved_movie') || '[]');
    const savedTV = JSON.parse(localStorage.getItem('user_saved_tv') || '[]');
    
    if (savedMovies.length) {
      const movieData = await this.fetchAllSavedMedia(savedMovies, 'movie');
      this.renderSavedSection(movieData, 'Movies');
    }
    if (savedTV.length) {
      const tvData = await this.fetchAllSavedMedia(savedTV, 'tv');
      this.renderSavedSection(tvData, 'TV Shows');
    }
  }

  async fetchAllSavedMedia(ids, type) {
    return Promise.all(
      ids.map(id => 
        fetch(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}`)
          .then(res => res.json())
          .catch(err => {
            console.error(`Error fetching ${type} ${id}:`, err);
            return null;
          })
      )
    ).then(results => results.filter(result => result !== null));
  }

  renderSavedSection(mediaData, type) {
    const savedGrid = document.getElementById('savedMoviesGrid');
    const watchLaterGrid = document.getElementById('watchLaterGrid');
    
    if (!savedGrid || !watchLaterGrid) return;

    // Clear existing content
    savedGrid.innerHTML = '';
    watchLaterGrid.innerHTML = '';

    // Filter by type and display
    const savedItems = mediaData.filter(item => !item.is_watch_later);
    const watchLaterItems = mediaData.filter(item => item.is_watch_later);

    // Display saved items
    savedItems.forEach(item => {
      const card = this.createMovieCard(item);
      savedGrid.appendChild(card);
    });

    // Display watch later items
    watchLaterItems.forEach(item => {
      const card = this.createMovieCard(item);
      watchLaterGrid.appendChild(card);
    });

    // Update empty states
    this.updateEmptyStates(savedItems.length, watchLaterItems.length);
  }

  updateEmptyStates(savedCount, watchLaterCount) {
    const savedEmptyState = document.getElementById('savedEmptyState');
    const watchLaterEmptyState = document.getElementById('watchLaterEmptyState');
    
    if (savedEmptyState) {
      savedEmptyState.style.display = savedCount === 0 ? 'block' : 'none';
    }
    
    if (watchLaterEmptyState) {
      watchLaterEmptyState.style.display = watchLaterCount === 0 ? 'block' : 'none';
    }
  }
}

// NEW DISPLAY FUNCTIONS FOR MOVIE-DETAIL PAGE (from user's "Debugged Load Function")
function loadSavedMedia() {
  const savedContainer = document.getElementById('savedMoviesGrid');
  const watchLaterContainer = document.getElementById('watchLaterGrid');
  
  if (!savedContainer || !watchLaterContainer) return;

  // 1. Get ALL saved items (movies + TV)
  const savedMovies = JSON.parse(localStorage.getItem('saved_movies') || '[]');
  const savedTVs = JSON.parse(localStorage.getItem('saved_tvs') || '[]');
  const watchLaterMovies = JSON.parse(localStorage.getItem('watch_later_movies') || '[]');
  const watchLaterTVs = JSON.parse(localStorage.getItem('watch_later_tvs') || '[]');

  // Combine and sort by timestamp
  const allSaved = [...savedMovies, ...savedTVs].sort((a,b) => b.timestamp - a.timestamp);
  const allWatchLater = [...watchLaterMovies, ...watchLaterTVs].sort((a,b) => b.timestamp - a.timestamp);

  // Update counts
  updateMovieCounts(allSaved.length, allWatchLater.length);

  // Display saved movies
  displaySavedSection(savedContainer, allSaved, 'saved');
  
  // Display watch later
  displaySavedSection(watchLaterContainer, allWatchLater, 'watchlater');
}

function displaySavedSection(container, items, type) {
  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align: center; padding: 40px; color: var(--text-secondary);">
        <i class="fas fa-${type === 'saved' ? 'heart-broken' : 'clock'}" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
        <h3>No ${type === 'saved' ? 'movies saved' : 'movies in watchlist'} yet</h3>
        <p>${type === 'saved' ? 'Start discovering amazing movies and save your favorites!' : 'Add movies to your watchlist to watch them later!'}</p>
      </div>
    `;
    return;
  }

  // Batch fetch details
  Promise.all(
    items.map(item => {
      const isTV = item.id.toString().includes('tv_');
      const cleanId = isTV ? item.id.toString().replace('tv_', '') : item.id;
      const mediaType = isTV ? 'tv' : 'movie';
      
      return fetch(`${TMDB_BASE_URL}/${mediaType}/${cleanId}?api_key=${TMDB_API_KEY}`)
        .then(res => res.json())
        .then(data => ({ ...data, mediaType, originalId: item.id, timestamp: item.timestamp }))
        .catch(e => {
          console.error(`Failed to fetch ${mediaType} ${cleanId}:`, e);
          return null;
        });
    })
  ).then(results => {
    const validResults = results.filter(Boolean);
    if (validResults.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
          <h3>Failed to load ${type === 'saved' ? 'saved movies' : 'watchlist'}</h3>
          <p>Please try refreshing the page.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = validResults.map(item => createEnhancedMovieCard(item, type)).join('');
    
    // Add event listeners for the new cards
    container.querySelectorAll('.movie-card').forEach(card => {
      const movieId = card.dataset.id;
      
      // Remove button
      card.querySelector('.remove-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        removeMovie(movieId, type);
      });
      
      // Watch later toggle
      card.querySelector('.watch-later-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWatchLater(movieId, item.mediaType);
      });
      
      // Like button
      card.querySelector('.like-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLike(movieId);
      });
    });
  });
}

function createEnhancedMovieCard(item, type) {
  const title = item.title || item.name || 'Unknown Title';
  const year = (item.release_date || item.first_air_date || '').slice(0, 4) || 'N/A';
  const rating = item.vote_average?.toFixed(1) || 'N/A';
  const poster = item.poster_path ? `${TMDB_IMAGE_BASE}w185${item.poster_path}` : 'https://via.placeholder.com/185x278/1A1A1A/B3B3B3?text=No+Poster';
  const overview = item.overview || 'No overview available.';
  const genres = item.genres ? item.genres.map(g => g.name).join(', ') : 'Unknown';
  
  return `
    <div class="movie-card" data-id="${item.originalId}" style="
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s ease;
      position: relative;
      cursor: pointer;
    ">
      <button class="remove-btn" style="
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(220, 38, 38, 0.9);
        color: white;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        z-index: 10;
      " title="Remove">
        <i class="fas fa-times"></i>
      </button>
      
      <div class="card-inner">
        <div class="card-front">
          <img src="${poster}" 
               onerror="this.src='https://via.placeholder.com/185x278/1A1A1A/B3B3B3?text=No+Poster'"
               style="width: 100%; height: 280px; object-fit: cover;">
          <div style="padding: 15px;">
            <h4 style="margin: 0 0 8px 0; font-size: 1rem; color: var(--text-primary); line-height: 1.3; height: 2.6em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
              ${title}
            </h4>
            <div style="display: flex; justify-content: space-between; align-items: center; color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 10px;">
              <span>${year}</span>
              <span style="color: var(--primary); font-weight: 600;">
                <i class="fas fa-star"></i> ${rating}
              </span>
            </div>
          </div>
        </div>
        
        <div class="card-back">
          <h3 style="margin: 0 0 10px 0; font-size: 1.1rem; color: var(--text-primary);">${title}</h3>
          <div style="margin-bottom: 10px; color: var(--text-secondary); font-size: 0.9rem;">
            <div style="margin-bottom: 5px;"><strong>Genre:</strong> ${genres}</div>
            <div style="margin-bottom: 5px;"><strong>Year:</strong> ${year}</div>
            <div><strong>Rating:</strong> <span style="color: var(--primary);">${rating}</span></div>
          </div>
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 15px; max-height: 80px; overflow-y: auto;">
            ${overview}
          </p>
          
          <div style="display: flex; gap: 8px; justify-content: space-between;">
            <button class="action-btn" onclick="watchTrailer(${item.originalId}, '${item.mediaType}')" style="
              background: var(--soft-gray);
              border: none;
              border-radius: 6px;
              padding: 8px 12px;
              color: var(--text-primary);
              cursor: pointer;
              transition: all 0.3s ease;
              font-size: 0.8rem;
              flex: 1;
            ">
              <i class="fas fa-play"></i> Trailer
            </button>
            
            <button class="watch-later-btn" style="
              background: var(--primary);
              border: none;
              border-radius: 6px;
              padding: 8px 12px;
              color: var(--dark);
              cursor: pointer;
              transition: all 0.3s ease;
              font-size: 0.8rem;
              flex: 1;
            " title="${type === 'saved' ? 'Add to Watch Later' : 'Remove from Watch Later'}">
              <i class="fas fa-${type === 'saved' ? 'clock' : 'check'}"></i> 
              ${type === 'saved' ? 'Watchlist' : 'Watching'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateMovieCounts(savedCount, watchLaterCount) {
  // Update all count displays
  const countElements = [
    document.getElementById('savedCount'),
    document.getElementById('mobileSavedCount')
  ];
  
  countElements.forEach(element => {
    if (element) {
      element.textContent = savedCount + watchLaterCount;
    }
  });
}

function removeMovie(movieId, type) {
  const key = type === 'saved' ? 'saved_movies' : 'watch_later_movies';
  const current = JSON.parse(localStorage.getItem(key) || '[]');
  const updated = current.filter(item => item.id !== movieId);
  localStorage.setItem(key, JSON.stringify(updated));
  
  // Refresh the display
  loadSavedMedia();
  
  // Show success message
  showSuccess(`Movie removed from ${type === 'saved' ? 'saved movies' : 'watchlist'}!`);
}

function toggleWatchLater(movieId, mediaType) {
  const savedKey = `saved_${mediaType}s`;
  const watchLaterKey = `watch_later_${mediaType}s`;
  
  const saved = JSON.parse(localStorage.getItem(savedKey) || '[]');
  const watchLater = JSON.parse(localStorage.getItem(watchLaterKey) || '[]');
  
  const movieData = { id: movieId, timestamp: Date.now() };
  
  // Check if movie is in saved
  const isInSaved = saved.some(item => item.id === movieId);
  const isInWatchLater = watchLater.some(item => item.id === movieId);
  
  if (isInSaved && !isInWatchLater) {
    // Move from saved to watch later
    const updatedSaved = saved.filter(item => item.id !== movieId);
    const updatedWatchLater = [...watchLater, movieData];
    
    localStorage.setItem(savedKey, JSON.stringify(updatedSaved));
    localStorage.setItem(watchLaterKey, JSON.stringify(updatedWatchLater));
    
    showSuccess('Movie moved to watch later!');
  } else if (isInWatchLater) {
    // Remove from watch later
    const updatedWatchLater = watchLater.filter(item => item.id !== movieId);
    localStorage.setItem(watchLaterKey, JSON.stringify(updatedWatchLater));
    
    showSuccess('Movie removed from watch later!');
  } else {
    // Add to watch later
    const updatedWatchLater = [...watchLater, movieData];
    localStorage.setItem(watchLaterKey, JSON.stringify(updatedWatchLater));
    
    showSuccess('Movie added to watch later!');
  }
  
  // Refresh display
  loadSavedMedia();
}

function toggleLike(movieId) {
  // For now, just show a message (you can implement like functionality later)
  showSuccess('Like feature coming soon!');
}

function showSuccess(message) {
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Helper function for fetching movie details (used by loadSavedMedia)
async function fetchMovieDetails(id, type) {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}`);
    return await res.json();
  } catch (error) {
    console.error(`Failed to load ${type} ${id}:`, error);
    return null;
  }
}

// Initialize movie manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.movieManager = new MovieManager();
  
  // Also initialize display functions for movie-detail page
  if (document.getElementById('savedMoviesGrid')) {
    loadSavedMedia();
  }
}); 