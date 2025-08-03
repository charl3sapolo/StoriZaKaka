// Ultimate Movie Gallery - Enhanced Movie Manager
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = window.TMDB_API_KEY || 'your-api-key-here';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Genre mapping for better display
const GENRE_MAP = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Science Fiction',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western'
};

class UltimateMovieGallery {
    constructor() {
        this.savedMovies = [];
        this.currentLayout = 'genre';
        this.currentTab = 'saved';
        this.isLoggedIn = this.checkIfLoggedIn();
        this.sessionId = this.getSessionId();
        this.init();
    }

    async init() {
        console.log('Initializing Ultimate Movie Gallery...');
        
        try {
            // Show skeleton loading immediately
            this.showSkeletonLoading();
            
            // Load saved movies with timeout
            const loadPromise = this.loadSavedMoviesOptimized();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Loading timeout')), 2800)
            );
            
            await Promise.race([loadPromise, timeoutPromise]);
            
            // Restore previous state BEFORE setting up controls
            this.restoreState();
            
            // Initialize layout controls
            this.setupLayoutControls();
            this.setupTabControls();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Render initial view
            this.renderCurrentLayout();
            
            console.log('Ultimate Movie Gallery initialized successfully');
            console.log('Current state:', {
                tab: this.currentTab,
                layout: this.currentLayout,
                movieCount: this.savedMovies.length
            });
        } catch (error) {
            console.error('Error during initialization:', error);
            this.showError('Failed to initialize movie gallery');
        }
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

    async loadSavedMoviesOptimized() {
        try {
            console.log('Loading saved movies with optimization...');
            
            // Check for preloaded data first
            if (sessionStorage.getItem('preloadedMovies')) {
                console.log('Using preloaded data from session storage');
                this.savedMovies = JSON.parse(sessionStorage.getItem('preloadedMovies'));
                return;
            }

            // Load from different sources based on login status
            if (this.isLoggedIn) {
                await this.loadFromDatabase();
            } else {
                await this.loadFromLocalStorage();
            }

            // Cache the data for performance
            sessionStorage.setItem('preloadedMovies', JSON.stringify(this.savedMovies));
            
        } catch (error) {
            console.error('Error loading saved movies:', error);
            this.showError('Failed to load saved movies');
        }
    }

    async loadFromDatabase() {
        console.log('Loading from database for logged-in user...');
        const response = await fetch(`/api/saved-movies/?is_logged_in=true`, {
            headers: {
                'X-CSRFToken': this.getCSRFToken()
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            this.savedMovies = data.movies || [];
            console.log(`Loaded ${this.savedMovies.length} movies from database`);
        }
    }

    async loadFromLocalStorage() {
        console.log('Loading from localStorage for anonymous user...');
        
        // Get saved movies from the main storage key
        const savedMovies = JSON.parse(localStorage.getItem('saved_movies') || '[]');
        
        console.log('Storage data found:', {
            savedMovies: savedMovies.length
        });
        
        if (savedMovies.length === 0) {
            console.log('No saved movies found in localStorage');
            this.savedMovies = [];
            return;
        }
        
        // Process saved movies - they should already have the required data
        this.savedMovies = savedMovies.map(movie => ({
            ...movie,
            // Ensure we have all required fields
            id: movie.id || movie.tmdb_id,
            tmdb_id: movie.tmdb_id || movie.id,
            title: movie.title || 'Unknown Title',
            poster_path: movie.poster_path || null,
            release_date: movie.release_date || null,
            vote_average: movie.vote_average || 0,
            genre_ids: movie.genre_ids || [],
            user_saved_date: movie.user_saved_date || movie.timestamp || new Date().toISOString(),
            is_watch_later: movie.is_watch_later || false,
            is_liked: movie.is_liked || false,
            mediaType: movie.mediaType || 'movie'
        }));
        
        console.log('Processed saved movies:', {
            total: this.savedMovies.length,
            watchLater: this.savedMovies.filter(m => m.is_watch_later).length,
            liked: this.savedMovies.filter(m => m.is_liked).length,
            saved: this.savedMovies.filter(m => !m.is_watch_later && !m.is_liked).length
        });
    }

    removeDuplicates(items) {
        const seen = new Set();
        return items.filter(item => {
            const id = item.id || item.tmdb_id || item;
            if (seen.has(id)) {
                return false;
            }
            seen.add(id);
            return true;
        });
    }

    async fetchDetailedData(items) {
        console.log(`Fetching detailed data for ${items.length} items...`);
        
        const detailedItems = [];
        const batchSize = 5; // Process in batches to avoid overwhelming the API
        
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchPromises = batch.map(item => this.fetchSingleItem(item));
            
            const batchResults = await Promise.all(batchPromises);
            detailedItems.push(...batchResults.filter(Boolean));
            
            // Add small delay between batches
            if (i + batchSize < items.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`Successfully fetched ${detailedItems.length} detailed items`);
        return detailedItems;
    }

    async fetchSingleItem(item) {
        try {
            const itemId = item.id || item.tmdb_id || item;
            const isTV = itemId.toString().includes('tv_');
            const cleanId = isTV ? itemId.toString().replace('tv_', '') : itemId;
            const mediaType = isTV ? 'tv' : 'movie';
            
            const url = `${TMDB_BASE_URL}/${mediaType}/${cleanId}?api_key=${TMDB_API_KEY}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                console.warn(`Failed to fetch ${mediaType} ${cleanId}: ${response.status}`);
                return null;
            }
            
            const data = await response.json();
            
            // Validate the data has required fields
            if (!data || (!data.title && !data.name)) {
                console.warn(`Invalid data for ${mediaType} ${cleanId}:`, data);
                return null;
            }
            
            // Preserve the original flags from the saved item
            return {
                ...data,
                mediaType,
                originalId: itemId,
                is_saved: true,
                is_watch_later: item.is_watch_later || false,
                is_liked: item.is_liked || false,
                user_saved_date: item.date_added || item.timestamp || item.user_saved_date || new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`Error fetching item ${item.id || item}:`, error);
            return null;
        }
    }

    setupLayoutControls() {
        const layoutButtons = document.querySelectorAll('.layout-btn');
        
        layoutButtons.forEach(button => {
            button.addEventListener('click', () => {
                const layout = button.getAttribute('data-layout');
                this.switchLayout(layout);
            });
        });
    }

    setupTabControls() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });
    }

    switchLayout(layout) {
        console.log(`Switching to ${layout} layout...`);
        
        // Update active button
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-layout="${layout}"]`).classList.add('active');
        
        // Hide all views
        document.querySelectorAll('.content-view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show selected view
        const targetView = document.getElementById(`${layout}View`);
        if (targetView) {
            targetView.classList.add('active');
        }
        
        this.currentLayout = layout;
        this.renderCurrentLayout();
        
        // Save layout preference
        localStorage.setItem('lastLayout', layout);
    }

    switchTab(tab) {
        console.log(`Switching to ${tab} tab...`);
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        this.currentTab = tab;
        this.renderCurrentLayout();
        
        // Save tab preference
        localStorage.setItem('lastTab', tab);
    }

    renderCurrentLayout() {
        const filteredMovies = this.getFilteredMovies();
        console.log(`Rendering ${this.currentTab} tab with ${filteredMovies.length} movies in ${this.currentLayout} layout`);
        
        if (filteredMovies.length === 0) {
            this.showEmptyState();
            return;
        }

        // Hide empty state
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        try {
            switch (this.currentLayout) {
                case 'genre':
                    this.renderGenreLayout(filteredMovies);
                    break;
                case 'stack':
                    this.renderStackLayout(filteredMovies);
                    break;
                case 'timeline':
                    this.renderTimelineLayout(filteredMovies);
                    break;
                default:
                    console.warn(`Unknown layout: ${this.currentLayout}, falling back to genre`);
                    this.renderGenreLayout(filteredMovies);
            }
        } catch (error) {
            console.error('Error rendering layout:', error);
            this.showError('Failed to render movie layout');
        }
    }

    getFilteredMovies() {
        console.log(`Filtering movies for tab: ${this.currentTab}`);
        console.log(`Total movies: ${this.savedMovies.length}`);
        
        let filtered = [];
        
        switch (this.currentTab) {
            case 'saved':
                // Show ALL saved movies (including watch later and liked)
                filtered = this.savedMovies;
                console.log(`All saved movies: ${filtered.length}`);
                break;
            case 'watchlater':
                // Show only watch later movies
                filtered = this.savedMovies.filter(movie => movie.is_watch_later === true);
                console.log(`Watch later movies: ${filtered.length}`);
                break;
            case 'liked':
                // Show only liked movies
                filtered = this.savedMovies.filter(movie => movie.is_liked === true);
                console.log(`Liked movies: ${filtered.length}`);
                break;
            default:
                filtered = this.savedMovies;
                console.log(`All movies: ${filtered.length}`);
        }
        
        return filtered;
    }

    renderGenreLayout(movies) {
        console.log('Rendering genre layout...');
        const container = document.getElementById('genreContainer');
        if (!container) return;
        
        // Group movies by genre
        const genreGroups = this.groupMoviesByGenre(movies);
        
        container.innerHTML = '';
        
        Object.entries(genreGroups).forEach(([genreName, genreMovies]) => {
            const genreRow = document.createElement('div');
            genreRow.className = 'genre-row';
            genreRow.setAttribute('data-genre', genreName);
            
            const movieCards = genreMovies.map(movie => this.createMovieCard(movie)).join('');
            genreRow.innerHTML = movieCards;
            
            container.appendChild(genreRow);
        });
    }

    renderStackLayout(movies) {
        console.log('Rendering stack layout...');
        const container = document.getElementById('stackContainer');
        if (!container) return;
        
        const movieCards = movies.map(movie => this.createMovieCard(movie)).join('');
        container.innerHTML = movieCards;
    }

    renderTimelineLayout(movies) {
        console.log('Rendering timeline layout...');
        const container = document.getElementById('timelineContainer');
        if (!container) return;
        
        // Sort movies by user_saved_date (newest first)
        const sortedMovies = [...movies].sort((a, b) => {
            const dateA = new Date(a.user_saved_date || a.date_added || a.created_at || Date.now());
            const dateB = new Date(b.user_saved_date || b.date_added || b.created_at || Date.now());
            return dateB - dateA;
        });
        
        // Group movies by month/year
        const monthGroups = this.groupMoviesByMonth(sortedMovies);
        
        container.innerHTML = '';
        
        Object.entries(monthGroups).forEach(([monthKey, monthMovies]) => {
            const timelineGroup = document.createElement('div');
            timelineGroup.className = 'timeline-group';
            
            const [year, month] = monthKey.split('-');
            const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
            });
            
            timelineGroup.innerHTML = `
                <div class="timeline-header">${monthName}</div>
                <div class="timeline-grid">
                    ${monthMovies.map(movie => this.createMovieCard(movie)).join('')}
                </div>
            `;
            
            container.appendChild(timelineGroup);
        });
    }

    groupMoviesByGenre(movies) {
        const groups = {};
        
        movies.forEach(movie => {
            if (movie.genre_ids && movie.genre_ids.length > 0) {
                const primaryGenre = movie.genre_ids[0];
                const genreName = GENRE_MAP[primaryGenre] || 'Other';
                
                if (!groups[genreName]) {
                    groups[genreName] = [];
                }
                groups[genreName].push(movie);
            } else {
                if (!groups['Other']) {
                    groups['Other'] = [];
                }
                groups['Other'].push(movie);
            }
        });
        
        return groups;
    }

    groupMoviesByMonth(movies) {
        const groups = {};
        
        movies.forEach(movie => {
            const saveDate = new Date(movie.user_saved_date || movie.date_added || movie.created_at || Date.now());
            const monthKey = `${saveDate.getFullYear()}-${String(saveDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (!groups[monthKey]) {
                groups[monthKey] = [];
            }
            groups[monthKey].push(movie);
        });
        
        // Sort months in descending order
        return Object.fromEntries(
            Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
        );
    }

    createMovieCard(movie) {
        // Handle poster path - could be full URL or just path
        let posterPath = '/static/logo.kakaflix.jpg';
        if (movie.poster_path) {
            if (movie.poster_path.startsWith('http')) {
                posterPath = movie.poster_path;
            } else if (movie.poster_path.startsWith('/')) {
                posterPath = `${TMDB_IMAGE_BASE}${movie.poster_path}`;
            } else {
                posterPath = `${TMDB_IMAGE_BASE}/${movie.poster_path}`;
            }
        }
        
        const title = movie.title || movie.name || 'Unknown Title';
        const year = (movie.release_date || movie.first_air_date || '').slice(0, 4) || 'N/A';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        const movieId = movie.id || movie.tmdb_id;
        
        return `
            <div class="movie-card" data-movie-id="${movieId}">
                <div class="card-inner">
                    <div class="card-front">
                        <img src="${posterPath}" alt="${title}" class="movie-poster" 
                             onerror="this.src='/static/logo.kakaflix.jpg'">
                        <div class="movie-info">
                            <h3 class="movie-title">${title}</h3>
                            <div class="movie-meta">
                                <span class="movie-year">${year}</span>
                                <span class="movie-rating">
                                    <i class="fas fa-star"></i>
                                    ${rating}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="card-back">
                        <div class="instant-actions">
                            <button class="action-btn" onclick="movieGallery.toggleWatchLater(${movieId})">
                                <i class="fas ${movie.is_watch_later ? 'fa-check' : 'fa-clock'}"></i>
                                ${movie.is_watch_later ? 'In Watchlist' : 'Watch Later'}
                            </button>
                            <button class="action-btn secondary" onclick="movieGallery.toggleLike(${movieId})">
                                <i class="fas ${movie.is_liked ? 'fa-heart' : 'fa-heart'}"></i>
                                ${movie.is_liked ? 'Liked' : 'Like'}
                            </button>
                            <button class="action-btn" onclick="movieGallery.removeMovie(${movieId})">
                                <i class="fas fa-trash"></i>
                                Remove
                            </button>
                            ${movie.is_saved ? '<div class="saved-badge">Saved</div>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async toggleWatchLater(movieId) {
        const movie = this.savedMovies.find(m => (m.id || m.tmdb_id) === movieId);
        if (!movie) return;

        const newWatchLaterStatus = !movie.is_watch_later;
        
        try {
            if (this.isLoggedIn) {
                await this.updateMovieStatusInDatabase(movieId, movie.is_liked, newWatchLaterStatus);
            } else {
                this.updateMovieStatusInLocalStorage(movieId, 'is_watch_later', newWatchLaterStatus);
            }

            movie.is_watch_later = newWatchLaterStatus;
            this.renderCurrentLayout();
            
            const message = newWatchLaterStatus ? 'Added to watch later!' : 'Removed from watch later!';
            this.showSuccess(message);
        } catch (error) {
            console.error('Error updating movie watch later status:', error);
            this.showError('Failed to update movie status');
        }
    }

    async toggleLike(movieId) {
        const movie = this.savedMovies.find(m => (m.id || m.tmdb_id) === movieId);
        if (!movie) return;

        const newLikeStatus = !movie.is_liked;
        
        try {
            if (this.isLoggedIn) {
                await this.updateMovieStatusInDatabase(movieId, newLikeStatus, movie.is_watch_later);
            } else {
                this.updateMovieStatusInLocalStorage(movieId, 'is_liked', newLikeStatus);
            }

            movie.is_liked = newLikeStatus;
            this.renderCurrentLayout();
            
            const message = newLikeStatus ? 'Movie liked!' : 'Movie unliked!';
            this.showSuccess(message);
        } catch (error) {
            console.error('Error updating movie like status:', error);
            this.showError('Failed to update movie status');
        }
    }

    async removeMovie(movieId) {
        try {
            if (this.isLoggedIn) {
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
                this.removeMovieFromLocalStorage(movieId);
            }

            // Remove from local array
            this.savedMovies = this.savedMovies.filter(movie => 
                (movie.id || movie.tmdb_id) !== movieId
            );

            this.renderCurrentLayout();
            this.updateCounts();
            this.showSuccess('Movie removed successfully');
        } catch (error) {
            console.error('Error removing movie:', error);
            this.showError('Failed to remove movie');
        }
    }

    updateMovieStatusInLocalStorage(movieId, field, value) {
        const key = 'saved_movies';
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        const item = items.find(item => (item.id || item.tmdb_id) === movieId);
        if (item) {
            item[field] = value;
            localStorage.setItem(key, JSON.stringify(items));
            console.log(`Updated ${field} for movie ${movieId} to ${value}`);
        }
    }

    removeMovieFromLocalStorage(movieId) {
        const key = 'saved_movies';
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        const filteredItems = items.filter(item => (item.id || item.tmdb_id) !== movieId);
        localStorage.setItem(key, JSON.stringify(filteredItems));
        console.log(`Removed movie ${movieId} from localStorage`);
    }

    async updateMovieStatusInDatabase(movieId, isLiked, isWatchLater) {
        const response = await fetch(`/api/update-movie-status/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: JSON.stringify({
                movie_id: movieId,
                is_liked: isLiked,
                is_watch_later: isWatchLater,
                is_logged_in: true
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update movie status');
        }
    }

    showEmptyState() {
        const emptyState = document.getElementById('emptyState');
        if (!emptyState) return;
        
        let message = '';
        let icon = '';
        
        switch (this.currentTab) {
            case 'saved':
                message = 'No movies saved yet';
                icon = 'fas fa-heart-broken';
                break;
            case 'watchlater':
                message = 'No movies in watchlist';
                icon = 'fas fa-clock';
                break;
            case 'liked':
                message = 'No liked movies yet';
                icon = 'fas fa-thumbs-down';
                break;
            default:
                message = 'No movies found';
                icon = 'fas fa-film';
        }
        
        emptyState.innerHTML = `
            <i class="${icon}"></i>
            <h3>${message}</h3>
            <p>Start discovering amazing movies and save your favorites!</p>
            <a href="/discover/" class="discover-btn">
                <i class="fas fa-search"></i>
                Discover Movies
            </a>
        `;
        
        emptyState.style.display = 'block';
        document.querySelectorAll('.content-view').forEach(view => {
            view.classList.remove('active');
        });
    }

    updateCounts() {
        const totalCount = this.savedMovies.length;
        const savedCountElement = document.getElementById('savedCount');
        const mobileSavedCountElement = document.getElementById('mobileSavedCount');
        
        if (savedCountElement) savedCountElement.textContent = totalCount;
        if (mobileSavedCountElement) mobileSavedCountElement.textContent = totalCount;
    }

    restoreState() {
        // Restore layout preference
        const lastLayout = localStorage.getItem('lastLayout') || 'genre';
        this.currentLayout = lastLayout;
        
        // Restore tab preference
        const lastTab = localStorage.getItem('lastTab') || 'saved';
        this.currentTab = lastTab;
        
        console.log(`Restored state: tab=${this.currentTab}, layout=${this.currentLayout}`);
        
        // Update UI to reflect restored state
        this.updateUIForState();
    }

    updateUIForState() {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeTabBtn = document.querySelector(`[data-tab="${this.currentTab}"]`);
        if (activeTabBtn) {
            activeTabBtn.classList.add('active');
        }
        
        // Update layout buttons
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeLayoutBtn = document.querySelector(`[data-layout="${this.currentLayout}"]`);
        if (activeLayoutBtn) {
            activeLayoutBtn.classList.add('active');
        }
        
        // Update content views
        document.querySelectorAll('.content-view').forEach(view => {
            view.classList.remove('active');
        });
        const activeView = document.getElementById(`${this.currentLayout}View`);
        if (activeView) {
            activeView.classList.add('active');
        }
    }

    setupEventListeners() {
        // Save state before unload
        window.addEventListener('beforeunload', () => {
            localStorage.setItem('lastLayout', this.currentLayout);
            localStorage.setItem('lastTab', this.currentTab);
        });

        // Theme and language toggles
        const themeToggle = document.getElementById('themeToggle');
        const languageToggle = document.getElementById('languageToggle');
        const body = document.body;

        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = body.getAttribute('data-theme') || 'dark';
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                body.setAttribute('data-theme', newTheme);
                themeToggle.querySelector('.theme-icon').textContent = newTheme === 'dark' ? '🌙' : '☀️';
                localStorage.setItem('theme', newTheme);
            });
        }

        if (languageToggle) {
            languageToggle.addEventListener('click', () => {
                const currentLang = body.getAttribute('data-lang') || 'en';
                const newLang = currentLang === 'en' ? 'sw' : 'en';
                body.setAttribute('data-lang', newLang);
                languageToggle.querySelector('span').textContent = newLang === 'en' ? 'SW' : 'EN';
                localStorage.setItem('language', newLang);
            });
        }

        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        const closeMenuBtn = document.getElementById('closeMenuBtn');

        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.add('open');
            });
        }

        if (closeMenuBtn && mobileMenu) {
            closeMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
            });
        }
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

    showSkeletonLoading() {
        const containers = ['genreContainer', 'stackContainer', 'timelineContainer'];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                const skeletonCount = 12; // Show 12 skeleton cards
                const skeletonHTML = Array(skeletonCount).fill().map(() => this.createSkeletonCard()).join('');
                container.innerHTML = skeletonHTML;
            }
        });
    }

    createSkeletonCard() {
        return `
            <div class="movie-card skeleton-card" data-movie-id="skeleton">
                <div class="card-inner">
                    <div class="card-front">
                        <div class="skeleton-poster"></div>
                        <div class="movie-info">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-meta">
                                <div class="skeleton-year"></div>
                                <div class="skeleton-rating"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize the Ultimate Movie Gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Ultimate Movie Gallery...');
    window.movieGallery = new UltimateMovieGallery();
    
    // Debug: Test TMDB API connection
    console.log('TMDB API Key available:', !!TMDB_API_KEY && TMDB_API_KEY !== 'your-api-key-here');
    console.log('TMDB Base URL:', TMDB_BASE_URL);
    
    // Test API connection with a simple movie
    if (TMDB_API_KEY && TMDB_API_KEY !== 'your-api-key-here') {
        fetch(`${TMDB_BASE_URL}/movie/550?api_key=${TMDB_API_KEY}`)
            .then(res => res.json())
            .then(data => {
                console.log('TMDB API test successful:', data.title);
            })
            .catch(err => {
                console.error('TMDB API test failed:', err);
            });
    }
}); 