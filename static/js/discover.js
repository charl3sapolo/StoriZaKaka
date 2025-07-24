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
  // Double-click to unflip
  card.addEventListener('dblclick', (e) => {
    card.classList.remove('flipped');
    e.stopPropagation();
  });

  return card;
}

// === TRENDING ROWS: FIRST ROW = MOST RECENT, SECOND ROW = OLDER TRENDING ===
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

// Initialize the app

document.addEventListener('DOMContentLoaded', function() {
  setupMoodSelection();
  fillTrendingRows('movie', 'moviesRow1', 'moviesRow2', 'moviesLoading1', 'moviesLoading2');
  fillTrendingRows('tv', 'tvRow1', 'tvRow2', 'tvLoading1', 'tvLoading2');
  setupGlobalUnflip();
  // Keep curated and mood logic
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

function saveToWatchlist(id, type) {
  alert(`Would save ${type} ID: ${id} to watchlist\n(Need to implement storage)`);
}