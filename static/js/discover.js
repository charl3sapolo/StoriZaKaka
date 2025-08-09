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

// Enhanced Mood Selector State Management
class MoodSelector {
  constructor() {
    this.selectedMoods = new Set();
    this.isAnalyzing = false;
    this.analysisDuration = 4500; // 4.5 seconds
    this.init();
  }

  init() {
    this.setupMoodOptions();
    this.setupAnalyzeButton();
    this.loadStoredPreferences();
  }

  setupMoodOptions() {
    const moodOptions = document.querySelectorAll('.mood-option');
    moodOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleMood(option);
      });
    });
  }

  toggleMood(moodElement) {
    const mood = moodElement.dataset.mood;
    
    if (this.selectedMoods.has(mood)) {
      this.selectedMoods.delete(mood);
      moodElement.classList.remove('selected');
    } else {
      this.selectedMoods.add(mood);
      moodElement.classList.add('selected');
    }

    this.updateAnalyzeButton();
    this.savePreferences();
  }

  updateAnalyzeButton() {
    const analyzeBtn = document.getElementById('getRecommendations');
    if (analyzeBtn) {
      const hasSelections = this.selectedMoods.size > 0;
      analyzeBtn.disabled = !hasSelections;
      
      if (hasSelections) {
        analyzeBtn.classList.remove('disabled');
        analyzeBtn.classList.add('enabled');
      } else {
        analyzeBtn.classList.remove('enabled');
        analyzeBtn.classList.add('disabled');
      }
    }
  }

  setupAnalyzeButton() {
    const analyzeBtn = document.getElementById('getRecommendations');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!this.isAnalyzing && this.selectedMoods.size > 0) {
          this.startAnalysis();
        }
      });
    }
  }

  async startAnalysis() {
    if (this.isAnalyzing) return;
    
    this.isAnalyzing = true;
    const analyzeBtn = document.getElementById('getRecommendations');
    const originalContent = analyzeBtn.innerHTML;
    
    // Show loading state
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    analyzeBtn.disabled = true;
    analyzeBtn.classList.add('analyzing');

    try {
      // Simulate analysis delay
      await this.simulateAnalysis();
      
      // Fetch recommendations based on selected moods
      const recommendations = await this.fetchMoodRecommendations();
      
      // Store preferences
      await this.storeMoodPreferences();
      
      // Display results
      this.displayCuratedResults(recommendations);
      
      // Reset selections
      this.resetSelections();
      
    } catch (error) {
      console.error('Analysis failed:', error);
      this.showError('Analysis failed. Please try again.');
    } finally {
      // Restore button state
      analyzeBtn.innerHTML = originalContent;
      analyzeBtn.disabled = false;
      analyzeBtn.classList.remove('analyzing');
      this.isAnalyzing = false;
    }
  }

  async simulateAnalysis() {
    return new Promise(resolve => {
      setTimeout(resolve, this.analysisDuration);
    });
  }

  async fetchMoodRecommendations() {
    const genreIds = [];
    this.selectedMoods.forEach(mood => {
      if (MOOD_TO_GENRE[mood]) {
        genreIds.push(...MOOD_TO_GENRE[mood]);
      }
    });

    if (genreIds.length === 0) {
      throw new Error('No valid genres found for selected moods');
    }

    const uniqueGenreIds = [...new Set(genreIds)];
    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${uniqueGenreIds.join(',')}&sort_by=popularity.desc&page=1`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  async storeMoodPreferences() {
    const moodPreferences = Array.from(this.selectedMoods);
    const sessionId = this.getSessionId();
    const isLoggedIn = this.checkIfLoggedIn();

    try {
      const response = await fetch('/api/mood-preferences/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCSRFToken(),
        },
        body: JSON.stringify({
          mood_preferences: moodPreferences,
          session_id: sessionId,
          is_logged_in: isLoggedIn
        })
      });

      if (!response.ok) {
        console.warn('Failed to store mood preferences:', response.status);
      }
    } catch (error) {
      console.warn('Error storing mood preferences:', error);
    }
  }

  getSessionId() {
    let sessionId = localStorage.getItem('movie_picker_session_id');
    if (!sessionId) {
      sessionId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('movie_picker_session_id', sessionId);
    }
    return sessionId;
  }

  checkIfLoggedIn() {
    // Check if user is logged in by looking for auth token or user data
    return document.querySelector('[data-user-id]') !== null;
  }

  getCSRFToken() {
    const token = document.querySelector('[name=csrfmiddlewaretoken]');
    return token ? token.value : '';
  }

  displayCuratedResults(recommendations) {
    const curatedSection = document.getElementById('curatedSection');
    const curatedGrid = document.getElementById('curatedGrid');
    
    if (!curatedSection || !curatedGrid) {
      console.error('Curated section elements not found');
      return;
    }

    // Clear existing content
    curatedGrid.innerHTML = '';

    if (recommendations.length === 0) {
      curatedGrid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search"></i>
          <p>No recommendations found for your selected moods.</p>
        </div>
      `;
    } else {
      // Limit to 4 movies for better user experience
      const limitedRecommendations = recommendations.slice(0, 4);
      
      // Add movie cards
      limitedRecommendations.forEach(movie => {
        const card = this.createMovieCard(movie);
        curatedGrid.appendChild(card);
      });
    }

    // Show the curated section
    curatedSection.style.display = 'block';
    curatedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.setAttribute('data-movie-id', movie.id);
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          <img src="${TMDB_IMAGE_BASE}${movie.poster_path}" 
               alt="${movie.title}" 
               class="movie-poster"
               onerror="this.src='/static/logo.kakaflix.jpg'">
          <div class="movie-info">
            <div class="movie-title">${movie.title}</div>
            <div class="movie-meta">
              <span class="movie-year">${movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
              <span class="movie-rating">
                <i class="fas fa-star"></i>
                ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        <div class="card-back">
          <div class="movie-title">${movie.title}</div>
          <div class="movie-overview">${movie.overview || 'No overview available.'}</div>
          <div class="card-actions">
            <button class="action-btn" onclick="watchTrailer(${movie.id}, 'movie')">
              <i class="fas fa-play"></i> Trailer
            </button>
            <button class="action-btn secondary" onclick="saveToWatchlist(${movie.id}, 'movie')">
              <i class="fas fa-heart"></i> Save
            </button>
          </div>
        </div>
      </div>
    `;

    // ENHANCED FLIP FUNCTIONALITY - Single-flip enforcement
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.action-btn')) {
        // Close all other flipped cards first (single-flip enforcement)
        document.querySelectorAll('#curatedSection .movie-card.flipped').forEach(flipped => {
          if (flipped !== card) flipped.classList.remove('flipped');
        });
        card.classList.toggle('flipped');
      }
    });

    return card;
  }

  resetSelections() {
    this.selectedMoods.clear();
    document.querySelectorAll('.mood-option.selected').forEach(option => {
      option.classList.remove('selected');
    });
    this.updateAnalyzeButton();
  }

  showError(message) {
    // Create and show error toast
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
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
    }, 4000);
  }

  loadStoredPreferences() {
    // Load any previously stored mood preferences
    const stored = localStorage.getItem('movie_picker_mood_preferences');
    if (stored) {
      try {
        const preferences = JSON.parse(stored);
        preferences.forEach(mood => {
          const moodElement = document.querySelector(`[data-mood="${mood}"]`);
          if (moodElement) {
            this.selectedMoods.add(mood);
            moodElement.classList.add('selected');
          }
        });
        this.updateAnalyzeButton();
      } catch (error) {
        console.warn('Failed to load stored preferences:', error);
      }
    }
  }

  savePreferences() {
    // Save current selections to localStorage
    const preferences = Array.from(this.selectedMoods);
    localStorage.setItem('movie_picker_mood_preferences', JSON.stringify(preferences));
  }
}

// Global mood selector instance
let moodSelector;


document.addEventListener('DOMContentLoaded', function() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const closeBtn = document.getElementById('closeMenuBtn');
  const menu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('menuOverlay');

  // Debugging check
  if (!menuBtn || !menu || !overlay) {
    console.error('Missing required menu elements!');
    return;
  }

  function toggleMenu() {
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
  }

  menuBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Menu button clicked'); // Debug
    toggleMenu();
  });

  closeBtn.addEventListener('click', function(e) {
    e.preventDefault();
    toggleMenu();
  });

  overlay.addEventListener('click', function(e) {
    e.preventDefault();
    toggleMenu();
  });

  // Close when clicking outside
  document.addEventListener('click', function(e) {
    if (menu.classList.contains('active') && 
        !menu.contains(e.target) && 
        e.target !== menuBtn) {
      toggleMenu();
    }
  });

  // Close on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && menu.classList.contains('active')) {
      toggleMenu();
    }
  });
});

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
    card.setAttribute('data-movie-id', item.id);
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

// --- Mood Analysis Completion Trigger ---
// This is a stub. Replace with your real mood analysis completion logic.
window.moodAnalysis = { completed: false };
// Example: when mood analysis is done, call showCuratedSection(window.moodAnalysis)


// === TRENDING ROWS: FIRST ROW = MOST RECENT, SECOND ROW = OLDER TRENDING ===
// ENSURE createMediaCard FUNCTION EXISTS FOR TRENDING ROWS
function createMediaCard(item, mediaType) {
  const isTV = mediaType === 'tv';
  const title = item.title || item.name || 'Untitled';
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const poster = item.poster_path 
    ? `${TMDB_IMAGE_BASE}${item.poster_path}`
    : 'https://via.placeholder.com/500x750/1A1A1A/B3B3B3?text=No+Poster';
  const rating = item.vote_average?.toFixed(1) || 'N/A';
  const overview = item.overview || 'No description available.';

  const card = document.createElement('div');
  card.className = 'movie-card';
  card.setAttribute('data-movie-id', item.id);
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
          <button class="action-btn" onclick="watchTrailer(${item.id}, '${mediaType}')">
            <i class="fas fa-play"></i> Trailer
          </button>
          <button class="action-btn secondary" onclick="saveToWatchlist(${item.id}, '${mediaType}')">
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

async function fillTrendingRows(mediaType, rowId1, rowId2, loadingId1, loadingId2) {
  const row1 = document.getElementById(rowId1);
  const row2 = document.getElementById(rowId2);
  const loading1 = document.getElementById(loadingId1);
  const loading2 = document.getElementById(loadingId2);
  row1.innerHTML = '';
  row2.innerHTML = '';
  row1.appendChild(loading1);
  row2.appendChild(loading2);
  loading1.classList.remove('hidden');
  loading2.classList.remove('hidden');

  // Fetch page 1 for row 1 (most recent trending)
  let page1Results = [];
  try {
    const res1 = await fetch(`${TMDB_BASE_URL}/trending/${mediaType}/week?api_key=${TMDB_API_KEY}&page=1`);
    const data1 = await res1.json();
    page1Results = (data1 && data1.results) ? data1.results : [];
    page1Results.forEach(item => {
      const card = createMediaCard(item, mediaType);
      row1.insertBefore(card, loading1);
    });
  } catch (e) {}
  loading1.classList.add('hidden');

  // Fetch page 2 for row 2 (older trending, but not in row 1)
  let page2Results = [];
  try {
    const res2 = await fetch(`${TMDB_BASE_URL}/trending/${mediaType}/week?api_key=${TMDB_API_KEY}&page=2`);
    const data2 = await res2.json();
    page2Results = (data2 && data2.results) ? data2.results : [];
    // Filter out any items already in row 1
    const row1Ids = new Set(page1Results.map(item => item.id));
    page2Results.filter(item => !row1Ids.has(item.id)).forEach(item => {
      const card = createMediaCard(item, mediaType);
      row2.insertBefore(card, loading2);
    });
  } catch (e) {}
  loading2.classList.add('hidden');
}

// === INFINITE HORIZONTAL SCROLLING FOR MULTIPLE ROWS (NO DUPLICATES BETWEEN ROWS, FILL BOTH ROWS INITIALLY) ===
class InfiniteMovieRow {
  constructor(mediaType, rowId, loadingId, siblingRow, rowIndex, sharedState) {
    this.mediaType = mediaType;
    this.row = document.getElementById(rowId);
    this.loading = document.getElementById(loadingId);
    this.page = 1;
    this.items = [];
    this.totalPages = 1;
    this.isLoading = false;
    this.loopIndex = 0;
    this.siblingRow = siblingRow; // Reference to the other row for this media type
    this.visibleIds = new Set(); // Track IDs in this row
    this.rowIndex = rowIndex; // 0 for first row, 1 for second
    this.sharedState = sharedState; // { loadedItems: [], loadedIds: Set, page: 1, totalPages: 1, isLoading: false }
    this.init();
  }

  async init() {
    this.showLoading();
    await this.initialFill();
    this.hideLoading();
    this.attachScrollListener();
  }

  async initialFill() {
    // Load at least one page, then fill rows with whatever is available
    let loadedAtLeastOne = false;
    let prevCount = 0;
    while (
      (!loadedAtLeastOne || (this.sharedState.loadedItems.length < 20 && this.sharedState.page <= this.sharedState.totalPages))
    ) {
      await this.sharedLoadNextPage();
      loadedAtLeastOne = true;
      this.appendInitialItems(); // Update UI after every page
      // If no more pages, break
      if (this.sharedState.page > this.sharedState.totalPages) break;
      // Failsafe: if no new items were added, break to avoid infinite loop
      if (this.sharedState.loadedItems.length === prevCount) break;
      prevCount = this.sharedState.loadedItems.length;
    }
  }

  appendInitialItems() {
    // Each row gets every other item (row 0: 0,2,4...; row 1: 1,3,5...)
    const siblingIds = this.siblingRow ? this.siblingRow.visibleIds : new Set();
    this.sharedState.loadedItems.forEach((item, idx) => {
      if (idx % 2 === this.rowIndex && !this.visibleIds.has(item.id) && !siblingIds.has(item.id)) {
        const card = createMediaCard(item, this.mediaType);
        this.row.insertBefore(card, this.loading);
        this.visibleIds.add(item.id);
      }
    });
  }

  async sharedLoadNextPage() {
    if (this.sharedState.isLoading) return;
    this.sharedState.isLoading = true;
    this.showLoading();
    try {
      const res = await fetch(`${TMDB_BASE_URL}/trending/${this.mediaType}/week?api_key=${TMDB_API_KEY}&page=${this.sharedState.page}`);
      const data = await res.json();
      if (data && data.results && data.results.length) {
        data.results.forEach(item => {
          if (!this.sharedState.loadedIds.has(item.id)) {
            this.sharedState.loadedItems.push(item);
            this.sharedState.loadedIds.add(item.id);
          }
        });
        this.sharedState.totalPages = data.total_pages || 1;
        this.sharedState.page++;
      }
    } catch (e) {}
    this.sharedState.isLoading = false;
    this.hideLoading();
  }

  attachScrollListener() {
    this.row.addEventListener('scroll', async () => {
      if (this.isLoading) return;
      // If near the end, load more or loop
      const { scrollLeft, scrollWidth, clientWidth } = this.row;
      if (scrollLeft + clientWidth >= scrollWidth - 300) {
        if (this.sharedState.page <= this.sharedState.totalPages) {
          await this.sharedLoadNextPage();
          this.appendNewSharedItems();
        } else {
          // Loop: append from start, skipping IDs in sibling row
          this.appendLoopItems();
        }
      }
    });
  }

  appendNewSharedItems() {
    // Add new items from shared pool that aren't in this row or sibling
    const siblingIds = this.siblingRow ? this.siblingRow.visibleIds : new Set();
    for (let i = 0; i < this.sharedState.loadedItems.length; i++) {
      const item = this.sharedState.loadedItems[i];
      if (i % 2 === this.rowIndex && !this.visibleIds.has(item.id) && !siblingIds.has(item.id)) {
        const card = createMediaCard(item, this.mediaType);
        this.row.insertBefore(card, this.loading);
        this.visibleIds.add(item.id);
      }
    }
  }

  appendLoopItems() {
    // Loop through shared pool, skipping IDs in sibling row
    const siblingIds = this.siblingRow ? this.siblingRow.visibleIds : new Set();
    let added = 0;
    let tries = 0;
    while (added < 10 && tries < this.sharedState.loadedItems.length) {
      const item = this.sharedState.loadedItems[this.loopIndex];
      this.loopIndex = (this.loopIndex + 1) % this.sharedState.loadedItems.length;
      if (!this.visibleIds.has(item.id) && !siblingIds.has(item.id)) {
        const card = createMediaCard(item, this.mediaType);
        this.row.insertBefore(card, this.loading);
        this.visibleIds.add(item.id);
        added++;
      }
      tries++;
    }
  }

  showLoading() {
    this.loading.classList.remove('hidden');
  }
  hideLoading() {
    this.loading.classList.add('hidden');
  }
}

// Helper to link sibling rows and share state
function setupInfiniteRows() {
  // Movies
  const movieShared = { loadedItems: [], loadedIds: new Set(), page: 1, totalPages: 1, isLoading: false };
  let moviesRow1, moviesRow2;
  moviesRow1 = new InfiniteMovieRow('movie', 'moviesRow1', 'moviesLoading1', null, 0, movieShared);
  moviesRow2 = new InfiniteMovieRow('movie', 'moviesRow2', 'moviesLoading2', moviesRow1, 1, movieShared);
  moviesRow1.siblingRow = moviesRow2;
  // TV Shows
  const tvShared = { loadedItems: [], loadedIds: new Set(), page: 1, totalPages: 1, isLoading: false };
  let tvRow1, tvRow2;
  tvRow1 = new InfiniteMovieRow('tv', 'tvRow1', 'tvLoading1', null, 0, tvShared);
  tvRow2 = new InfiniteMovieRow('tv', 'tvRow2', 'tvLoading2', tvRow1, 1, tvShared);
  tvRow1.siblingRow = tvRow2;
}

// --- Genre Dropdown and Dynamic Genre Section ---
const GENRE_API_URL = `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`;
let GENRE_MAP = {};

async function populateGenreDropdown() {
  const select = document.getElementById('genreSelect');
  try {
    const res = await fetch(GENRE_API_URL);
    const data = await res.json();
    if (data.genres) {
      GENRE_MAP = {};
      data.genres.forEach(g => {
        GENRE_MAP[g.id] = g.name;
        const option = document.createElement('option');
        option.value = g.id;
        option.textContent = g.name;
        select.appendChild(option);
      });
    }
  } catch (e) {
    // fallback: static genres
    const fallback = {
      28: "Action", 12: "Adventure", 35: "Comedy", 18: "Drama", 27: "Horror", 10749: "Romance", 878: "Science Fiction"
    };
    GENRE_MAP = fallback;
    Object.entries(fallback).forEach(([id, name]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      select.appendChild(option);
    });
  }
}

async function fetchMoviesByGenre(genreId) {
  const res = await fetch(`${TMDB_BASE_URL}/discover/movie?with_genres=${genreId}&api_key=${TMDB_API_KEY}&sort_by=popularity.desc`);
  const data = await res.json();
  return data.results || [];
}

function displayGenreMovies(movies) {
  const row = document.getElementById('genreMovieRow');
  row.innerHTML = '';
  if (!movies || movies.length === 0) {
    row.innerHTML = '<div style="padding:2rem;text-align:center;width:100%;color:var(--text-secondary);font-size:1.1rem;">No movies or dramas found for this combination.</div>';
    return;
  }
  movies.forEach(movie => {
    const card = createMediaCard(movie, 'movie');
    row.appendChild(card);
  });
}

function setupGenreDropdown() {
  const select = document.getElementById('genreSelect');
  const section = document.getElementById('selectedGenreSection');
  const title = document.getElementById('genreTitle');
  select.addEventListener('change', async (e) => {
    const genreId = e.target.value;
    if (!genreId) {
      section.style.display = 'none';
      return;
    }
    section.style.display = 'block';
    title.textContent = `${GENRE_MAP[genreId] || 'Genre'} Movies`;
    const movies = await fetchMoviesByGenre(genreId);
    displayGenreMovies(movies);
  });
}

// --- Explore Dropdowns: Populate and Handle All Filters ---
const YEAR_START = 1970;
const YEAR_END = new Date().getFullYear();
const LANGUAGE_API_URL = `${TMDB_BASE_URL}/configuration/languages?api_key=${TMDB_API_KEY}`;

async function populateYearDropdown() {
  const select = document.getElementById('yearSelect');
  for (let y = YEAR_END; y >= YEAR_START; y--) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    select.appendChild(option);
  }
}

// --- Populate Language Dropdown with Common Movie-Producing Countries Only ---
const COMMON_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'sw', name: 'Swedish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' }
];

async function populateLanguageDropdown() {
  const select = document.getElementById('languageSelect');
  try {
    const res = await fetch(LANGUAGE_API_URL);
    const data = await res.json();
    data.forEach(l => {
      const option = document.createElement('option');
      option.value = l.iso_639_1;
      option.textContent = l.english_name;
      select.appendChild(option);
    });
  } catch (e) {
    // fallback
    COMMON_LANGUAGES.forEach(l => {
      const option = document.createElement('option');
      option.value = l.code;
      option.textContent = l.name;
      select.appendChild(option);
    });
  }
}

// --- Fetch Movies by All Explore Filters (with Drama Type) ---
async function fetchMoviesByExploreFilters() {
  const genreId = document.getElementById('genreSelect').value;
  const year = document.getElementById('yearSelect').value;
  const language = document.getElementById('languageSelect').value;
  const dramaType = document.getElementById('dramaTypeSelect').value;
  let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc`;
  if (genreId) url += `&with_genres=${genreId}`;
  if (year) url += `&primary_release_year=${year}`;
  if (language) url += `&with_original_language=${language}`;
  // Drama type logic
  if (dramaType) {
    if (dramaType === 'kdrama') {
      url += `&with_original_language=ko&region=KR`;
    } else if (dramaType === 'cdrama') {
      url += `&with_original_language=zh&region=CN`;
    } else if (dramaType === 'jdrama') {
      url += `&with_original_language=ja&region=JP`;
    } else if (dramaType === 'thaidrama') {
      url += `&with_original_language=th&region=TH`;
    } else if (dramaType === 'turkishdrama') {
      url += `&with_original_language=tr&region=TR`;
    }
    // 'other' = no extra filter
  }
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

function setupExploreDropdowns() {
  const selects = [
    document.getElementById('genreSelect'),
    document.getElementById('yearSelect'),
    document.getElementById('languageSelect'),
    document.getElementById('dramaTypeSelect')
  ];
  const section = document.getElementById('selectedGenreSection');
  const title = document.getElementById('genreTitle');
  selects.forEach(sel => {
    sel.addEventListener('change', async () => {
      // If all are empty, hide section
      if (selects.every(s => !s.value)) {
        section.style.display = 'none';
        return;
      }
      section.style.display = 'block';
      // Compose title
      let t = [];
      if (selects[3].value) {
        // Drama type label
        const dramaMap = {
          kdrama: 'K-Drama', cdrama: 'C-Drama', jdrama: 'J-Drama', thaidrama: 'Thai Drama', turkishdrama: 'Turkish Drama', other: 'Other Drama'
        };
        t.push(dramaMap[selects[3].value] || 'Drama');
      }
      if (selects[0].value) t.push(GENRE_MAP[selects[0].value] || 'Genre');
      if (selects[1].value) t.push(selects[1].value);
      if (selects[2].value) t.push(selects[2].options[selects[2].selectedIndex].textContent);
      title.textContent = t.length ? t.join(' / ') + ' Movies' : 'Explore Movies';
      const movies = await fetchMoviesByExploreFilters();
      displayGenreMovies(movies);
    });
  });
}

// --- Curated Section Visibility Logic ---
function showCuratedSection(moodAnalysis) {
  const curatedSection = document.getElementById('curatedSection');
  if (moodAnalysis && moodAnalysis.completed) {
    curatedSection.style.display = 'block';
    // Load mood-based recommendations (reuse getCuratedRecommendations)
    getCuratedRecommendations();
  } else {
    curatedSection.style.display = 'none';
  }
}

// Function to get curated recommendations (placeholder for existing functionality)
async function getCuratedRecommendations() {
  // This function can be enhanced to load curated content
  // For now, it's a placeholder to maintain existing functionality
  console.log('Loading curated recommendations...');
}

// Initialize the app

document.addEventListener('DOMContentLoaded', function() {
  // Initialize enhanced mood selector
  moodSelector = new MoodSelector();
  
  populateGenreDropdown();
  populateYearDropdown();
  populateLanguageDropdown();
  setupExploreDropdowns();
  
  // RESTORE ORIGINAL TRENDING LOADER (exact previous implementation)
  fillTrendingRows('movie', 'moviesRow1', 'moviesRow2', 'moviesLoading1', 'moviesLoading2');
  fillTrendingRows('tv', 'tvRow1', 'tvRow2', 'tvLoading1', 'tvLoading2');
  
  setupGlobalUnflip();
  showCuratedSection(window.moodAnalysis); // Initial check
  
  // Setup global unflip function
  function setupGlobalUnflip() {
    // Close all flipped cards when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.movie-card')) {
        document.querySelectorAll('.movie-card.flipped').forEach(card => {
          card.classList.remove('flipped');
        });
      }
    });
  }
  
  // Retry button handler
  document.querySelector('.retry-btn')?.addEventListener('click', () => {
    document.querySelector('.error-state').classList.add('hidden');
    fillTrendingRows('movie', 'moviesRow1', 'moviesRow2', 'moviesLoading1', 'moviesLoading2');
    fillTrendingRows('tv', 'tvRow1', 'tvRow2', 'tvLoading1', 'tvLoading2');
  });
});

function goHome() {
  window.location.href = '/';
}

// --- Trailer Modal Logic ---
function ensureTrailerModal() {
  if (document.getElementById('trailerModal')) return;
  const modal = document.createElement('div');
  modal.id = 'trailerModal';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="trailer-modal-backdrop"></div>
    <div class="trailer-modal-content">
      <button class="trailer-modal-close" id="trailerModalClose">&times;</button>
      <div id="trailerModalBody"></div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('trailerModalClose').onclick = closeTrailerModal;
  modal.querySelector('.trailer-modal-backdrop').onclick = closeTrailerModal;
}

function showTrailerModal(iframeHtml) {
  ensureTrailerModal();
  const modal = document.getElementById('trailerModal');
  const body = document.getElementById('trailerModalBody');
  body.innerHTML = iframeHtml;
  modal.style.display = 'flex';
  setTimeout(() => { modal.classList.add('show'); }, 10);
}

function closeTrailerModal() {
  const modal = document.getElementById('trailerModal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => { modal.style.display = 'none'; }, 200);
    document.getElementById('trailerModalBody').innerHTML = '';
  }
}

async function watchTrailer(id, type) {
  ensureTrailerModal();
  const modal = document.getElementById('trailerModal');
  const body = document.getElementById('trailerModalBody');
  body.innerHTML = '<div style="padding:2rem;text-align:center;">Loading trailer...</div>';
  modal.style.display = 'flex';
  setTimeout(() => { modal.classList.add('show'); }, 10);
  try {
    const res = await fetch(`${TMDB_BASE_URL}/${type}/${id}/videos?api_key=${TMDB_API_KEY}`);
    const data = await res.json();
    const trailers = (data.results || []).filter(v => v.site === 'YouTube' && v.type === 'Trailer');
    if (trailers.length > 0) {
      const trailer = trailers[0];
      const iframe = `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" frameborder="0" allowfullscreen allow="autoplay; encrypted-media"></iframe>`;
      body.innerHTML = iframe;
    } else {
      body.innerHTML = '<div style="padding:2rem;text-align:center;">No trailer found for this title.</div>';
    }
  } catch (e) {
    body.innerHTML = '<div style="padding:2rem;text-align:center;">Could not load trailer. Please try again later.</div>';
  }
}

// --- Trailer Modal Styles ---
(function addTrailerModalStyles() {
  if (document.getElementById('trailerModalStyles')) return;
  const style = document.createElement('style');
  style.id = 'trailerModalStyles';
  style.textContent = `
    #trailerModal {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      display: none; align-items: center; justify-content: center;
      z-index: 9999;
      background: rgba(0,0,0,0.45);
      transition: background 0.2s;
    }
    #trailerModal.show { background: rgba(0,0,0,0.85); }
    .trailer-modal-backdrop {
      position: absolute; top: 0; left: 0; width: 100vw; height: 100vh;
      background: transparent;
    }
    .trailer-modal-content {
      position: relative; background: #18181b; border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.45);
      padding: 0; max-width: 700px; width: 95vw;
      animation: trailerPopIn 0.2s;
    }
    .trailer-modal-close {
      position: absolute; top: 8px; right: 12px; font-size: 2rem;
      background: none; border: none; color: #fff; cursor: pointer;
      z-index: 2;
      transition: color 0.2s;
    }
    .trailer-modal-close:hover { color: #F5B823; }
    #trailerModalBody { padding: 0; }
    @keyframes trailerPopIn { from { transform: scale(0.95); opacity: 0.5; } to { transform: scale(1); opacity: 1; } }
    @media (max-width: 600px) {
      .trailer-modal-content { max-width: 98vw; }
      #trailerModalBody iframe { height: 220px !important; }
    }
  `;
  document.head.appendChild(style);
})();

async function saveToWatchlist(id, type) {
  if (!id || !type) return;
  
  try {
    // Get the movie data from the card
    const movieCard = document.querySelector(`[data-${type}-id="${id}"]`);
    if (!movieCard) {
      console.error(`Movie card not found for ${type} ID: ${id}`);
      return false;
    }
    
    console.log('Found movie card:', movieCard);
    
    // Extract movie data from the card with better error handling
    const titleElement = movieCard.querySelector('.movie-title');
    const posterElement = movieCard.querySelector('.movie-poster');
    const yearElement = movieCard.querySelector('.movie-year');
    const ratingElement = movieCard.querySelector('.movie-rating');
    
    console.log('Extracted elements:', {
      titleElement: titleElement?.textContent,
      posterElement: posterElement?.src,
      yearElement: yearElement?.textContent,
      ratingElement: ratingElement?.textContent
    });
    
    // Extract poster path from full URL
    let poster_path = '';
    if (posterElement?.src) {
      const posterUrl = posterElement.src;
      if (posterUrl.includes('image.tmdb.org')) {
        poster_path = posterUrl.split('/w500/')[1] || posterUrl.split('/original/')[1] || '';
        poster_path = '/' + poster_path;
      }
    }
    
        const movieData = {
        tmdb_id: parseInt(id),
        title: titleElement?.textContent?.trim() || 'Unknown Title',
        overview: '', // Will be populated from TMDB API if needed
        poster_path: poster_path,
        backdrop_path: '',
        release_date: yearElement?.textContent?.trim() || null,
        vote_average: parseFloat(ratingElement?.textContent?.replace(/[^\d.]/g, '')) || 0,
        vote_count: 0,
        genre_ids: [], // Will be populated from TMDB API
        media_type: type,
        is_logged_in: true,
        user_saved_date: new Date().toISOString(),
        is_watch_later: false,
        is_liked: false
    };
    
    console.log('Created movie data:', movieData);
    
    // Check if user is logged in
    const isLoggedIn = checkIfLoggedIn();
    
    if (isLoggedIn) {
      // Save to database
      try {
        const result = await saveMovieToDatabase(movieData);
        if (result.success) {
          showSaveSuccess(result.message);
          return true;
        } else {
          showError(result.error || 'Failed to save movie');
          return false;
        }
      } catch (error) {
        console.error('Database save failed:', error);
        showError('Failed to save movie to database');
        return false;
      }
    } else {
      // Save to localStorage for anonymous users
      const key = 'saved_movies';
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      
      // Check if movie already exists
      if (!current.some(item => item.tmdb_id === parseInt(id))) {
        const updated = [...current, movieData];
        localStorage.setItem(key, JSON.stringify(updated));
        console.log(`Saved ${type} to localStorage:`, movieData);
        
        showSaveSuccess('Movie saved successfully!');
        return true;
      } else {
        showSaveSuccess('Movie already saved!');
        return true;
      }
    }
  } catch (e) {
    console.error("Save failed:", e);
    showError('Failed to save movie. Please try again.');
    return false;
  }
}

async function saveMovieToDatabase(movieData) {
  const csrfToken = getCSRFToken();
  
  const response = await fetch('/api/save-movie/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken
    },
    body: JSON.stringify(movieData)
  });

  if (!response.ok) {
    throw new Error('Failed to save movie to database');
  }

  return await response.json();
}

async function saveMovieToLocalStorage(movieData) {
  const savedMovies = JSON.parse(localStorage.getItem('saved_movies') || '[]');
  
  // Add expiration date (1 day from now)
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 1);
  movieData.expires_at = expirationDate.toISOString();
  
  // Check if movie already exists
  const existingIndex = savedMovies.findIndex(movie => movie.tmdb_id === movieData.tmdb_id);
  
  if (existingIndex >= 0) {
    // Update existing movie
    savedMovies[existingIndex] = movieData;
  } else {
    // Add new movie
    savedMovies.push(movieData);
  }
  
  // Clean up expired movies
  const now = new Date();
  const validMovies = savedMovies.filter(movie => {
    if (!movie.expires_at) return true; // Keep movies without expiration
    return new Date(movie.expires_at) > now;
  });
  
  localStorage.setItem('saved_movies', JSON.stringify(validMovies));
}

function showSaveSuccess(movieTitle) {
  // Create success toast
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <span>"${movieTitle}" saved to your movies!</span>
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

function showError(message) {
  // Create and show error toast
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.innerHTML = `
    <i class="fas fa-exclamation-triangle"></i>
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
  }, 4000);
}

function checkIfLoggedIn() {
  // Check for user authentication indicator
  const userIndicator = document.querySelector('[data-user-id]');
  const authLinks = document.querySelectorAll('a[href*="/accounts/login/"]');
  const logoutLinks = document.querySelectorAll('a[href*="/accounts/logout/"]');
  
  // If we see logout links, user is logged in
  if (logoutLinks.length > 0) {
    return true;
  }
  
  // If we see login links and no logout links, user is not logged in
  if (authLinks.length > 0 && logoutLinks.length === 0) {
    return false;
  }
  
  // Check for user indicator as fallback
  if (userIndicator && userIndicator.getAttribute('data-user-id') !== '') {
    return true;
  }
  
  // Default to false if we can't determine
  return false;
}