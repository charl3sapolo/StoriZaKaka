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
        
        // Show loading container
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
            loadingContainer.style.display = 'flex';
        }
        
        // Load from localStorage using the correct key from discover.js
        const savedMovies = JSON.parse(localStorage.getItem('saved_movies') || '[]');
        console.log('📊 Found movies in localStorage:', savedMovies.length);
        
        // Remove duplicates and ensure data integrity
        const uniqueMovies = this.removeDuplicates(savedMovies);
        console.log('🔍 Unique movies after deduplication:', uniqueMovies.length);
        
        // Process existing movies with performance monitoring
        console.log('🔄 Processing movies...');
        const startTime = performance.now();
        
        this.savedMovies = uniqueMovies.map(movie => this.processMovie(movie));
        
        const endTime = performance.now();
        console.log(`⏱️ Movie processing took ${(endTime - startTime).toFixed(2)}ms`);
        
        console.log('🎬 Processed movies:', this.savedMovies.length);
        
        // Update counts
        this.updateCounts();
        
        // Display movies
        this.displayMovies();
    }

    removeDuplicates(movies) {
        const seen = new Set();
        const uniqueMovies = [];
        
        movies.forEach(movie => {
            const movieId = movie.id || movie.tmdb_id;
            const key = `${movieId}-${movie.title}`;
            
            if (!seen.has(key)) {
                seen.add(key);
                uniqueMovies.push(movie);
            } else {
                console.log('🔄 Removing duplicate:', movie.title);
            }
        });
        
        return uniqueMovies;
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
        
        const startTime = performance.now();
        
        const filteredMovies = this.getFilteredMovies();
        console.log(`📊 Filtered movies: ${filteredMovies.length}`);
        
        // Hide loading container now that we have data
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
        
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
        
        const endTime = performance.now();
        console.log(`⏱️ Display took ${(endTime - startTime).toFixed(2)}ms`);
        
        // Add event listeners to cards after they're created
        this.setupCardEventListeners();
    }

    setupCardEventListeners() {
        const cards = document.querySelectorAll('.movie-card');
        cards.forEach(card => {
            // Add click event for card flip
            card.addEventListener('click', (e) => {
                // Don't flip if clicking on action buttons
                if (!e.target.closest('.action-btn')) {
                    card.classList.toggle('flipped');
                }
            });
            
            // Add keyboard support for accessibility
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.classList.toggle('flipped');
                }
            });
            
            // Make card focusable for accessibility
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            
            // Add aria-label
            const title = card.querySelector('.movie-title')?.textContent || 'Movie';
            card.setAttribute('aria-label', `Movie: ${title}`);
        });
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
        
        const startTime = performance.now();
        
        const container = document.getElementById('genreContainer');
        if (!container) {
            console.error('❌ Genre container not found!');
            return;
        }
        
        // Group movies by genre with improved categorization
        const genreGroups = {};
        movies.forEach(movie => {
            // First try to get genres from genre_ids
            let genres = [];
            if (movie.genre_ids && movie.genre_ids.length > 0) {
                genres = movie.genre_ids.map(id => GENRE_MAP[id]).filter(genre => genre);
            }
            
            // If that fails, try to get genres from genres array if available
            if (genres.length === 0 && movie.genres && movie.genres.length > 0) {
                genres = movie.genres.map(genre => genre.name || genre).filter(genre => genre);
            }
            
            // If still no valid genres found, try to infer from movie data
            if (genres.length === 0) {
                // Try to get genre from overview if available
                const overview = movie.overview?.toLowerCase() || '';
                const title = movie.title?.toLowerCase() || '';
                
                // Check both title and overview for genre keywords
                const text = title + ' ' + overview;
                
                if (text.includes('action') || text.includes('fight') || text.includes('war') || 
                    text.includes('battle') || text.includes('combat')) {
                    genres = ['Action'];
                } else if (text.includes('comedy') || text.includes('funny') || text.includes('humor') || 
                          text.includes('laugh') || text.includes('hilarious')) {
                    genres = ['Comedy'];
                } else if (text.includes('horror') || text.includes('scary') || text.includes('fear') || 
                          text.includes('terror') || text.includes('nightmare')) {
                    genres = ['Horror'];
                } else if (text.includes('romance') || text.includes('love') || text.includes('romantic') || 
                          text.includes('relationship')) {
                    genres = ['Romance'];
                } else if (text.includes('sci-fi') || text.includes('science fiction') || text.includes('space') || 
                          text.includes('future') || text.includes('alien')) {
                    genres = ['Science Fiction'];
                } else if (text.includes('thriller') || text.includes('suspense') || text.includes('mystery')) {
                    genres = ['Thriller'];
                } else if (text.includes('adventure') || text.includes('journey') || text.includes('quest')) {
                    genres = ['Adventure'];
                } else if (text.includes('fantasy') || text.includes('magic') || text.includes('mythical')) {
                    genres = ['Fantasy'];
                } else if (text.includes('drama') || text.includes('emotional')) {
                    genres = ['Drama'];
                } else {
                    // Default to Drama for unknown genres as last resort
                    genres = ['Drama'];
                }
            }
            
            // Use the first valid genre
            const primaryGenre = genres[0];
            
            if (!genreGroups[primaryGenre]) {
                genreGroups[primaryGenre] = [];
            }
            genreGroups[primaryGenre].push(movie);
        });
        
        console.log('📂 Genre groups:', Object.keys(genreGroups));
        
        // Clear container
        container.innerHTML = '';
        
        // Sort genres by popularity (number of movies)
        const sortedGenres = Object.entries(genreGroups)
            .sort(([,a], [,b]) => b.length - a.length);
        
        // Create genre rows with proper scrolling
        sortedGenres.forEach(([genreName, genreMovies]) => {
            console.log(`🎬 Creating ${genreName} row with ${genreMovies.length} movies`);
            
            const genreRow = document.createElement('div');
            genreRow.className = 'genre-row';
            genreRow.setAttribute('data-genre', genreName);
            
            // Create movie cards
            const movieCards = genreMovies.map(movie => this.createMovieCard(movie)).join('');
            
            // Create the genre label as a card-like element
            const genreLabelCard = `
                <div class="genre-label-card">
                    <div class="genre-label-content">
                        <h3 class="genre-name">${genreName}</h3>
                        <span class="genre-count">${genreMovies.length} movie${genreMovies.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            `;
            
            // Create the row with proper scrolling container
            genreRow.innerHTML = `
                <div class="movie-cards-container">
                    ${movieCards}
                    ${genreLabelCard}
                </div>
            `;
            
            container.appendChild(genreRow);
        });
        
        const endTime = performance.now();
        console.log(`✅ Genre layout displayed successfully in ${(endTime - startTime).toFixed(2)}ms`);
    }

    displayStackLayout(movies) {
        console.log('📚 Displaying stack layout');
        
        const container = document.getElementById('stackContainer');
        if (!container) {
            console.error('❌ Stack container not found!');
            return;
        }
        
        // Apply stacked effect CSS
        container.style.position = 'relative';
        
        // Clear container first
        container.innerHTML = '';
        
        // Add cards with stacked effect
        movies.forEach((movie, index) => {
            const cardElement = document.createElement('div');
            cardElement.innerHTML = this.createMovieCard(movie);
            const card = cardElement.firstElementChild;
            
            // Add stacked positioning
            if (card) {
                card.style.position = 'relative';
                card.style.marginTop = index > 0 ? '-20px' : '0';
                card.style.zIndex = movies.length - index; // Higher index = lower in stack
                card.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                card.style.transition = 'transform 0.3s ease, margin-top 0.3s ease';
                
                // Add hover effect
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'translateY(-10px) scale(1.05)';
                    card.style.zIndex = 100; // Bring to front on hover
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
                    card.style.zIndex = movies.length - index;
                });
                
                container.appendChild(card);
            }
        });
        
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
                     decoding="async"
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
        const watchLaterCount = this.savedMovies.filter(movie => movie.is_watch_later === true).length;
        const likedCount = this.savedMovies.filter(movie => movie.is_liked === true).length;
        
        console.log(`📊 Updating counts: ${totalCount} total, ${watchLaterCount} watch later, ${likedCount} liked`);
        
        // Update specific count elements only (more efficient)
        const elementsToUpdate = [
            { id: 'savedCount', value: totalCount },
            { id: 'mobileSavedCount', value: totalCount },
            { id: 'watchLaterCount', value: watchLaterCount },
            { id: 'savedCountStat', value: totalCount },
            { id: 'watchLaterCountStat', value: watchLaterCount }
        ];
        
        elementsToUpdate.forEach(({ id, value }) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
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
        
        // Refresh profile page if we're on it
        this.refreshProfilePage();
        
        console.log(`🗑️ Removed movie ${movieId}`);
    }

    refreshProfilePage() {
        // If we're on the profile page, refresh the counts
        if (window.location.pathname.includes('/profile/')) {
            const profileManager = window.profileManager;
            if (profileManager) {
                profileManager.loadMovieCounts();
            }
        }
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