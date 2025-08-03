// Ultimate Movie Gallery - Proper Implementation
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
        this.init();
    }

    init() {
        console.log('🚀 Initializing Ultimate Movie Gallery...');
        
        // Setup controls first
        this.setupControls();
        
        // Load and display movies
        this.loadAndDisplayMovies();
        
        console.log('✅ Gallery initialized successfully');
    }

    checkIfLoggedIn() {
        const userIndicator = document.querySelector('[data-user-id]');
        return userIndicator && userIndicator.getAttribute('data-user-id') !== '';
    }

    setupControls() {
        // Setup tab controls
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // Setup layout controls
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const layout = btn.getAttribute('data-layout');
                this.switchLayout(layout);
            });
        });

        // Setup other event listeners
        this.setupEventListeners();
    }

    loadAndDisplayMovies() {
        console.log('📂 Loading movies...');
        
        // Show skeleton loading
        this.showSkeletonLoading();
        
        // Load from localStorage using the correct key from discover.js
        const savedMovies = JSON.parse(localStorage.getItem('saved_movies') || '[]');
        console.log('📊 Found movies in localStorage:', savedMovies.length);
        
        if (savedMovies.length === 0) {
            console.log('➕ No movies found, adding test movie...');
            this.addTestMovie();
        } else {
            // Process existing movies
            this.savedMovies = savedMovies.map(movie => this.processMovie(movie));
        }
        
        console.log('🎬 Processed movies:', this.savedMovies.length);
        
        // Update counts
        this.updateCounts();
        
        // Display movies
        this.displayMovies();
    }

    showSkeletonLoading() {
        console.log('🔄 Showing skeleton loading...');
        
        const containers = ['genreContainer', 'stackContainer', 'timelineContainer'];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = this.createSkeletonCards(6);
            }
        });
    }

    createSkeletonCards(count) {
        const skeletonCards = [];
        for (let i = 0; i < count; i++) {
            skeletonCards.push(`
                <div class="skeleton-card">
                    <div class="skeleton-poster"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-meta">
                            <div class="skeleton-year"></div>
                            <div class="skeleton-rating"></div>
                        </div>
                    </div>
                </div>
            `);
        }
        return skeletonCards.join('');
    }

    addTestMovie() {
        const testMovie = {
            id: 550,
            tmdb_id: 550,
            title: "Fight Club",
            poster_path: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
            release_date: "1999",
            vote_average: 8.8,
            genre_ids: [18],
            user_saved_date: new Date().toISOString(),
            is_watch_later: false,
            is_liked: false,
            mediaType: 'movie',
            timestamp: Date.now()
        };
        
        // Add to localStorage using the correct key
        const current = JSON.parse(localStorage.getItem('saved_movies') || '[]');
        current.push(testMovie);
        localStorage.setItem('saved_movies', JSON.stringify(current));
        
        // Add to current array
        this.savedMovies = [this.processMovie(testMovie)];
        
        console.log('✅ Test movie added:', testMovie.title);
    }

    processMovie(movie) {
        // Handle poster path with better validation
        let posterPath = movie.poster_path;
        if (posterPath && posterPath !== 'null' && posterPath !== 'undefined') {
            // If it's already a full URL, keep it
            if (posterPath.startsWith('http')) {
                posterPath = posterPath;
            } else if (posterPath.startsWith('/')) {
                // TMDB path format
                posterPath = `${TMDB_IMAGE_BASE}${posterPath}`;
            } else if (posterPath) {
                // Other format, try to construct URL
                posterPath = `${TMDB_IMAGE_BASE}/${posterPath}`;
            }
        } else {
            posterPath = null;
        }
        
        // Extract year
        let year = 'N/A';
        if (movie.release_date) {
            if (movie.release_date.includes('-')) {
                year = movie.release_date.split('-')[0];
            } else {
                year = movie.release_date;
            }
        }
        
        return {
            ...movie,
            id: movie.id || movie.tmdb_id,
            tmdb_id: movie.tmdb_id || movie.id,
            title: movie.title || 'Unknown Title',
            poster_path: posterPath,
            release_date: movie.release_date || null,
            vote_average: movie.vote_average || 0,
            genre_ids: movie.genre_ids || [],
            user_saved_date: movie.user_saved_date || movie.timestamp || new Date().toISOString(),
            is_watch_later: movie.is_watch_later || false,
            is_liked: movie.is_liked || false,
            mediaType: movie.mediaType || 'movie',
            year: year,
            rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'
        };
    }

    switchTab(tab) {
        console.log(`🔄 Switching to ${tab} tab`);
        
        // Update active button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        this.currentTab = tab;
        this.displayMovies();
        
        // Save preference
        localStorage.setItem('lastTab', tab);
    }

    switchLayout(layout) {
        console.log(`🔄 Switching to ${layout} layout`);
        
        // Update active button
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-layout="${layout}"]`).classList.add('active');
        
        // Update content views
        document.querySelectorAll('.content-view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${layout}View`).classList.add('active');
        
        this.currentLayout = layout;
        this.displayMovies();
        
        // Save preference
        localStorage.setItem('lastLayout', layout);
    }

    displayMovies() {
        console.log(`🎬 Displaying movies for ${this.currentTab} tab in ${this.currentLayout} layout`);
        
        const filteredMovies = this.getFilteredMovies();
        console.log(`📊 Filtered movies: ${filteredMovies.length}`);
        
        if (filteredMovies.length === 0) {
            this.showEmptyState();
            return;
        }

        // Hide empty state
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        // Display based on layout
        switch (this.currentLayout) {
            case 'genre':
                this.displayGenreLayout(filteredMovies);
                break;
            case 'stack':
                this.displayStackLayout(filteredMovies);
                break;
            case 'timeline':
                this.displayTimelineLayout(filteredMovies);
                break;
            default:
                this.displayGenreLayout(filteredMovies);
        }
    }

    getFilteredMovies() {
        switch (this.currentTab) {
            case 'saved':
                return this.savedMovies;
            case 'watchlater':
                return this.savedMovies.filter(movie => movie.is_watch_later === true);
            case 'liked':
                return this.savedMovies.filter(movie => movie.is_liked === true);
            default:
                return this.savedMovies;
        }
    }

    displayGenreLayout(movies) {
        console.log('🎭 Displaying genre layout with', movies.length, 'movies');
        
        const container = document.getElementById('genreContainer');
        if (!container) {
            console.error('❌ Genre container not found!');
            return;
        }
        
        // Group movies by genre
        const genreGroups = {};
        movies.forEach(movie => {
            const primaryGenre = movie.genre_ids && movie.genre_ids.length > 0 ? 
                movie.genre_ids[0] : null;
            const genreName = primaryGenre ? GENRE_MAP[primaryGenre] || 'Other' : 'Other';
            
            if (!genreGroups[genreName]) {
                genreGroups[genreName] = [];
            }
            genreGroups[genreName].push(movie);
        });
        
        console.log('📂 Genre groups:', Object.keys(genreGroups));
        
        // Clear container
        container.innerHTML = '';
        
        // Create genre rows
        Object.entries(genreGroups).forEach(([genreName, genreMovies]) => {
            console.log(`🎬 Creating ${genreName} row with ${genreMovies.length} movies`);
            
            const genreRow = document.createElement('div');
            genreRow.className = 'genre-row';
            genreRow.setAttribute('data-genre', genreName);
            
            const movieCards = genreMovies.map(movie => this.createMovieCard(movie)).join('');
            
            genreRow.innerHTML = movieCards;
            container.appendChild(genreRow);
        });
        
        console.log('✅ Genre layout displayed successfully');
    }

    displayStackLayout(movies) {
        console.log('📚 Displaying stack layout');
        
        const container = document.getElementById('stackContainer');
        if (!container) {
            console.error('❌ Stack container not found!');
            return;
        }
        
        const movieCards = movies.map(movie => this.createMovieCard(movie)).join('');
        container.innerHTML = movieCards;
        
        console.log(`✅ Stack layout displayed with ${movies.length} movies`);
    }

    displayTimelineLayout(movies) {
        console.log('📅 Displaying timeline layout');
        
        const container = document.getElementById('timelineContainer');
        if (!container) {
            console.error('❌ Timeline container not found!');
            return;
        }
        
        // Sort by save date (newest first)
        const sortedMovies = [...movies].sort((a, b) => {
            const dateA = new Date(a.user_saved_date || Date.now());
            const dateB = new Date(b.user_saved_date || Date.now());
            return dateB - dateA;
        });
        
        // Group by month/year
        const monthGroups = {};
        sortedMovies.forEach(movie => {
            const saveDate = new Date(movie.user_saved_date || Date.now());
            const monthKey = `${saveDate.getFullYear()}-${String(saveDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthGroups[monthKey]) {
                monthGroups[monthKey] = [];
            }
            monthGroups[monthKey].push(movie);
        });
        
        // Clear container
        container.innerHTML = '';
        
        // Create timeline groups
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
        
        console.log(`✅ Timeline layout displayed with ${Object.keys(monthGroups).length} months`);
    }

    createMovieCard(movie) {
        const title = movie.title || 'Unknown Title';
        const year = movie.year || 'N/A';
        const rating = movie.rating || 'N/A';
        const movieId = movie.id || movie.tmdb_id;
        
        // Handle poster with better error handling
        let posterHtml = '';
        if (movie.poster_path && movie.poster_path !== 'null') {
            // Ensure the poster path is a complete URL
            let posterUrl = movie.poster_path;
            if (posterUrl && !posterUrl.startsWith('http')) {
                if (posterUrl.startsWith('/')) {
                    posterUrl = `${TMDB_IMAGE_BASE}${posterUrl}`;
                } else {
                    posterUrl = `${TMDB_IMAGE_BASE}/${posterUrl}`;
                }
            }
            
            posterHtml = `
                <img src="${posterUrl}" 
                     alt="${title}" 
                     class="movie-poster" 
                     loading="lazy" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/150x200/333/666?text=No+Image'; this.classList.add('skeleton-poster');"
                     onload="this.classList.remove('skeleton-poster');">
            `;
        } else {
            posterHtml = `<div class="movie-poster skeleton-poster"></div>`;
        }
        
        return `
            <div class="movie-card" data-movie-id="${movieId}">
                <div class="card-inner">
                    <div class="card-front">
                        ${posterHtml}
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
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showEmptyState() {
        console.log('📭 Showing empty state');
        
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
        
        // Hide all content views
        document.querySelectorAll('.content-view').forEach(view => {
            view.classList.remove('active');
        });
    }

    updateCounts() {
        const totalCount = this.savedMovies.length;
        console.log(`📊 Updating counts: ${totalCount} movies`);
        
        const savedCountElement = document.getElementById('savedCount');
        const mobileSavedCountElement = document.getElementById('mobileSavedCount');
        
        if (savedCountElement) savedCountElement.textContent = totalCount;
        if (mobileSavedCountElement) mobileSavedCountElement.textContent = totalCount;
    }

    async toggleWatchLater(movieId) {
        const movie = this.savedMovies.find(m => (m.id || m.tmdb_id) === movieId);
        if (!movie) return;

        const newWatchLaterStatus = !movie.is_watch_later;
        
        // Update in localStorage
        const items = JSON.parse(localStorage.getItem('saved_movies') || '[]');
        const item = items.find(item => (item.id || item.tmdb_id) === movieId);
        if (item) {
            item.is_watch_later = newWatchLaterStatus;
            localStorage.setItem('saved_movies', JSON.stringify(items));
        }

        // Update in memory
        movie.is_watch_later = newWatchLaterStatus;
        
        // Re-display
        this.displayMovies();
        
        console.log(`✅ Toggled watch later for ${movie.title}: ${newWatchLaterStatus}`);
    }

    async toggleLike(movieId) {
        const movie = this.savedMovies.find(m => (m.id || m.tmdb_id) === movieId);
        if (!movie) return;

        const newLikeStatus = !movie.is_liked;
        
        // Update in localStorage
        const items = JSON.parse(localStorage.getItem('saved_movies') || '[]');
        const item = items.find(item => (item.id || item.tmdb_id) === movieId);
        if (item) {
            item.is_liked = newLikeStatus;
            localStorage.setItem('saved_movies', JSON.stringify(items));
        }

        // Update in memory
        movie.is_liked = newLikeStatus;
        
        // Re-display
        this.displayMovies();
        
        console.log(`✅ Toggled like for ${movie.title}: ${newLikeStatus}`);
    }

    async removeMovie(movieId) {
        // Remove from localStorage
        const items = JSON.parse(localStorage.getItem('saved_movies') || '[]');
        const filteredItems = items.filter(item => (item.id || item.tmdb_id) !== movieId);
        localStorage.setItem('saved_movies', JSON.stringify(filteredItems));

        // Remove from memory
        this.savedMovies = this.savedMovies.filter(movie => 
            (movie.id || movie.tmdb_id) !== movieId
        );

        // Update counts and re-display
        this.updateCounts();
        this.displayMovies();
        
        console.log(`🗑️ Removed movie ${movieId}`);
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
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

        // Language toggle
        const languageToggle = document.getElementById('languageToggle');
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌐 DOM loaded, creating movie gallery...');
    window.movieGallery = new UltimateMovieGallery();
}); 