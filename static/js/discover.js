// TMDB API Configuration
const TMDB_API_KEY = window.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Mood to Genre Mapping
const MOOD_TO_GENRE = {
  comedy: [35], 
  drama: [18],
  action: [28],
  romance: [10749],
  adventure: [12],
  thriller: [53, 9648],
  family: [10751],
  horror: [27]
};

class MediaLoader {
  constructor(mediaType, gridId) {
    this.mediaType = mediaType;
    this.grid = document.getElementById(gridId);
    this.currentPage = 1;
    this.isLoading = false;
    this.hasMore = true;
    this.observer = null;
    this.initIntersectionObserver();
  }

  initIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.isLoading && this.hasMore) {
        this.loadMore();
      }
    }, { threshold: 0.1 });

    const target = this.grid.querySelector('.skeleton-card:last-child') || 
                  this.grid.nextElementSibling;
    if (target) this.observer.observe(target);
  }

  async loadMore() {
    if (this.isLoading || !this.hasMore) return;
    this.isLoading = true;
    
    this.grid.nextElementSibling.classList.remove('hidden');
    
    try {
      const data = await this.fetchPage(this.currentPage);
      if (data?.results?.length) {
        this.appendItems(data.results);
        this.currentPage++;
        this.hasMore = this.currentPage <= data.total_pages;
      } else {
        this.hasMore = false;
      }
    } catch (error) {
      console.error(`Error loading ${this.mediaType}:`, error);
      document.querySelector('.error-state').classList.remove('hidden');
    } finally {
      this.isLoading = false;
      this.grid.nextElementSibling.classList.add('hidden');
      this.removeSkeletons();
      this.updateObserver();
    }
  }

  async fetchPage(page) {
    const response = await fetch(
      `${TMDB_BASE_URL}/trending/${this.mediaType}/week?api_key=${TMDB_API_KEY}&page=${page}`
    );
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  }

  appendItems(items) {
    items.forEach(item => {
      const card = this.createMediaCard(item);
      this.grid.appendChild(card);
    });
  }

  createMediaCard(item) {
    const isTV = this.mediaType === 'tv';
    const title = item.title || item.name || 'Untitled';
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const poster = item.poster_path 
      ? `${TMDB_IMAGE_BASE}${item.poster_path}`
      : 'https://via.placeholder.com/500x750/1A1A1A/B3B3B3?text=No+Poster';
    const rating = item.vote_average?.toFixed(1) || 'N/A';
    const overview = item.overview || 'No description available.';

    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <img src="${poster}" alt="${title}" class="movie-poster" loading="lazy"
               onerror="this.src='https://via.placeholder.com/500x750/1A1A1A/B3B3B3?text=No+Poster'">
          <div class="movie-info">
            <h3 class="movie-title">${title}</h3>
            <div class="movie-meta">
              <span>${year}</span>
              <div class="movie-rating">
                <i class="fas fa-star"></i>
                <span>${rating}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card-back">
          <h3 class="movie-title">${title.length > 32 ? title.slice(0, 29) + '...' : title}</h3>
          <div class="movie-overview">${overview}</div>
          <div class="card-actions">
            <button class="action-btn" onclick="watchTrailer(${item.id}, '${this.mediaType}')">
              <i class="fas fa-play"></i> Trailer
            </button>
            <button class="action-btn secondary" onclick="saveToWatchlist(${item.id}, '${this.mediaType}')">
              <i class="fas fa-bookmark"></i> Save
            </button>
          </div>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (!e.target.closest('.action-btn')) {
        document.querySelectorAll('.movie-card').forEach(c => c.classList.remove('flipped'));
        card.classList.add('flipped');
      }
    });

    return card;
  }

  removeSkeletons() {
    const skeletons = this.grid.querySelectorAll('.skeleton-card');
    if (skeletons.length > 0) {
      skeletons.forEach(skeleton => skeleton.remove());
    }
  }

  updateObserver() {
    if (this.observer) {
      this.observer.disconnect();
      const lastCard = this.grid.lastElementChild;
      if (lastCard) this.observer.observe(lastCard);
    }
  }
}

// Mood Selection State
let selectedMoods = [];

function setupMoodSelection() {
  const moodOptions = document.querySelectorAll('.mood-option');
  const getRecsBtn = document.getElementById('getRecommendations');
  
  moodOptions.forEach(option => {
    option.addEventListener('click', function() {
      const mood = this.dataset.mood;
      this.classList.toggle('selected');
      
      if (this.classList.contains('selected')) {
        selectedMoods.push(mood);
      } else {
        selectedMoods = selectedMoods.filter(m => m !== mood);
      }
      
      getRecsBtn.disabled = selectedMoods.length === 0;
    });
  });

  document.getElementById('getRecommendations').addEventListener('click', getCuratedRecommendations);
  document.getElementById('refreshCurated')?.addEventListener('click', getCuratedRecommendations);
}

async function getCuratedRecommendations() {
  const curatedSection = document.getElementById('curatedSection');
  const curatedGrid = document.getElementById('curatedGrid');
  
  curatedSection.classList.remove('hidden');
  curatedGrid.innerHTML = Array(6).fill(`
    <div class="skeleton-card">
      <div class="skeleton-poster"></div>
      <div class="skeleton-title"></div>
      <div class="skeleton-meta"></div>
    </div>
  `).join('');
  
  try {
    const genreIds = [...new Set(selectedMoods.flatMap(mood => MOOD_TO_GENRE[mood] || []))];
    
    if (genreIds.length === 0) {
      throw new Error('No genres selected');
    }
    
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}` +
      `&with_genres=${genreIds.join(',')}&sort_by=popularity.desc&page=1`
    );
    
    const data = await response.json();
    
    curatedGrid.innerHTML = '';
    if (data.results?.length) {
      data.results.forEach(movie => {
        const card = createMediaCard(movie, 'movie');
        curatedGrid.appendChild(card);
      });
    } else {
      throw new Error('No recommendations found');
    }
  } catch (error) {
    console.error('Error getting recommendations:', error);
    curatedGrid.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>Could not load recommendations. Please try again.</p>
      </div>
    `;
  }
}

function createMediaCard(item, type = 'movie') {
  const isTV = type === 'tv';
  const title = item.title || item.name || 'Untitled';
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const poster = item.poster_path 
    ? `${TMDB_IMAGE_BASE}${item.poster_path}`
    : 'https://via.placeholder.com/500x750/1A1A1A/B3B3B3?text=No+Poster';
  const rating = item.vote_average?.toFixed(1) || 'N/A';
  const overview = item.overview || 'No description available.';

  const card = document.createElement('div');
  card.className = 'movie-card';
  card.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        <img src="${poster}" alt="${title}" class="movie-poster" loading="lazy"
             onerror="this.src='https://via.placeholder.com/500x750/1A1A1A/B3B3B3?text=No+Poster'">
        <div class="movie-info">
          <h3 class="movie-title">${title}</h3>
          <div class="movie-meta">
            <span>${year}</span>
            <div class="movie-rating">
              <i class="fas fa-star"></i>
              <span>${rating}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="card-back">
        <h3 class="movie-title">${title.length > 32 ? title.slice(0, 29) + '...' : title}</h3>
        <div class="movie-overview">${overview}</div>
        <div class="card-actions">
          <button class="action-btn" onclick="watchTrailer(${item.id}, '${type}')">
            <i class="fas fa-play"></i> Trailer
          </button>
          <button class="action-btn secondary" onclick="saveToWatchlist(${item.id}, '${type}')">
            <i class="fas fa-bookmark"></i> Save
          </button>
        </div>
      </div>
    </div>
  `;

  card.addEventListener('click', (e) => {
    if (!e.target.closest('.action-btn')) {
      document.querySelectorAll('.movie-card').forEach(c => c.classList.remove('flipped'));
      card.classList.add('flipped');
    }
  });

  return card;
}

// === HORIZONTAL ROWS FOR TRENDING MOVIES/TV ===
async function loadTrendingRow(mediaType, rowId, count = 15) {
  const row = document.getElementById(rowId);
  if (!row) return;
  // Show skeletons
  row.innerHTML = Array(6).fill(`
    <div class="skeleton-card">
      <div class="skeleton-poster"></div>
      <div class="skeleton-title"></div>
      <div class="skeleton-meta"></div>
    </div>
  `).join('');
  try {
    const res = await fetch(`${TMDB_BASE_URL}/trending/${mediaType}/week?api_key=${TMDB_API_KEY}&page=1`);
    const data = await res.json();
    row.innerHTML = '';
    (data.results || []).slice(0, count).forEach(item => {
      const card = createMediaCard(item, mediaType);
      row.appendChild(card);
    });
  } catch (e) {
    row.innerHTML = `<div class='error-message'><i class='fas fa-exclamation-triangle'></i> Failed to load content</div>`;
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
  setupMoodSelection();
  // Horizontal rows for trending movies/TV
  loadTrendingRow('movie', 'moviesRow', 15);
  loadTrendingRow('tv', 'tvRow', 15);
  // Keep curated and mood logic
  // Retry button handler
  document.querySelector('.retry-btn')?.addEventListener('click', () => {
    document.querySelector('.error-state').classList.add('hidden');
    loadTrendingRow('movie', 'moviesRow', 15);
    loadTrendingRow('tv', 'tvRow', 15);
  });
});

function goHome() {
  window.location.href = '/';
}

function watchTrailer(id, type) {
  alert(`Would play trailer for ${type} ID: ${id}\n(Integration with YouTube/TMDB videos API needed)`);
}

function saveToWatchlist(id, type) {
  alert(`Would save ${type} ID: ${id} to watchlist\n(Need to implement storage)`);
}