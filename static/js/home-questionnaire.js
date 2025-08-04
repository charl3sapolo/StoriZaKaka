// Home Page Questionnaire JavaScript
const TMDB_API_KEY = window.TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Question mapping to TMDB parameters
const QUESTION_MAPPING = {
    mood: {
        happy: { with_keywords: '180547', with_genres: '35' },
        sad: { with_genres: '18' },
        excited: { with_genres: '28' },
        calm: { with_genres: '16' },
        stressed: { with_genres: '53' },
        romantic: { with_genres: '10749' },
        adventurous: { with_genres: '12' },
        nostalgic: { with_genres: '10751' }
    },
    genre: {
        comedy: { with_genres: '35' },
        horror: { with_genres: '27' },
        'sci-fi': { with_genres: '878' },
        action: { with_genres: '28' },
        documentary: { with_genres: '99' }
    },
    era: {
        '2000s': { primary_release_year: '2000', 'primary_release_date.gte': '2000-01-01', 'primary_release_date.lte': '2009-12-31' },
        '90s': { primary_release_year: '1990', 'primary_release_date.gte': '1990-01-01', 'primary_release_date.lte': '1999-12-31' },
        recent: { 'primary_release_date.gte': '2020-01-01' },
        classic: { 'primary_release_date.lte': '1980-12-31' }
    },
    intensity: {
        light: { 'vote_average.gte': '6', 'vote_average.lte': '8' },
        medium: { 'vote_average.gte': '6.5', 'vote_average.lte': '8.5' },
        dark: { 'vote_average.gte': '7', 'vote_average.lte': '9' },
        epic: { 'vote_average.gte': '7.5', 'vote_average.lte': '10' }
    },
    duration: {
        short: { 'with_runtime.lte': '90' },
        standard: { 'with_runtime.gte': '90', 'with_runtime.lte': '120' },
        long: { 'with_runtime.gte': '120' },
        series: { with_genres: '10770' }
    },
    watchingWith: {
        alone: { with_genres: '18,27,53' },  // Drama, Horror, Thriller
        partner: { with_genres: '10749,35' }, // Romance, Comedy
        friends: { with_genres: '28,12,35' }, // Action, Adventure, Comedy
        family: { with_genres: '10751,16,35' } // Family, Animation, Comedy
    },
    timeAvailable: {
        short: { 'with_runtime.lte': '90' },
        medium: { 'with_runtime.gte': '90', 'with_runtime.lte': '150' },
        long: { 'with_runtime.gte': '150' }
    }
};

let questionnaireState = {
    currentQuestion: 1,
    totalQuestions: 5,
    answers: {},
    isProcessing: false
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing questionnaire...'); // Debug log
    initializeQuestionnaire();
    setupEventListeners();
});

function initializeQuestionnaire() {
    console.log('Initializing questionnaire...'); // Debug log
    questionnaireState = {
        currentQuestion: 1,
        totalQuestions: 5,
        answers: {},
        isProcessing: false
    };
    
    showQuestion(1);
    updateProgress();
    
    hideElement('discoverBtn');
    hideElement('analysis-text');
    hideElement('recommendationPreview');
    hideElement('movieRecommendationModal');
}

function setupEventListeners() {
    console.log('Setting up event listeners...'); // Debug log
    
    const moodButtons = document.querySelectorAll('.mood-btn');
    console.log('Found mood buttons:', moodButtons.length); // Debug log
    
    moodButtons.forEach(btn => {
        btn.addEventListener('click', handleMoodSelection);
        console.log('Added click listener to button:', btn.dataset.value); // Debug log
    });
    
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const discoverBtn = document.getElementById('discoverBtn');
    
    if (nextBtn) {
        nextBtn.addEventListener('click', handleNext);
        console.log('Added click listener to Next button'); // Debug log
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', handlePrevious);
        console.log('Added click listener to Previous button'); // Debug log
    }
    if (discoverBtn) {
        discoverBtn.addEventListener('click', handleDiscover);
        console.log('Added click listener to Discover button'); // Debug log
    }
    
    const closeModalBtn = document.getElementById('closeRecommendationModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeRecommendationModal);
    }
    
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', resetQuestionnaire);
    }
    
    const watchTrailerBtn = document.getElementById('watchTrailerBtn');
    if (watchTrailerBtn) {
        watchTrailerBtn.addEventListener('click', handleWatchTrailer);
    }
}

function handleMoodSelection(event) {
    const btn = event.currentTarget;
    const questionType = btn.closest('.mood-options').dataset.question;
    const value = btn.dataset.value;
    
    console.log('Mood selection:', { questionType, value }); // Debug log
    
    btn.closest('.mood-options').querySelectorAll('.mood-btn').forEach(b => {
        b.classList.remove('selected');
    });
    
    btn.classList.add('selected');
    questionnaireState.answers[questionType] = value;
    
    console.log('Updated answers:', questionnaireState.answers); // Debug log
    
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.classList.add('active');
        console.log('Next button enabled'); // Debug log
    }
}

function handleNext() {
    console.log('Next button clicked, current question:', questionnaireState.currentQuestion); // Debug log
    if (questionnaireState.currentQuestion < questionnaireState.totalQuestions) {
        questionnaireState.currentQuestion++;
        showQuestion(questionnaireState.currentQuestion);
        updateProgress();
        updateNavigationButtons();
    } else {
        showDiscoverButton();
    }
}

function handlePrevious() {
    console.log('Previous button clicked, current question:', questionnaireState.currentQuestion); // Debug log
    if (questionnaireState.currentQuestion > 1) {
        questionnaireState.currentQuestion--;
        showQuestion(questionnaireState.currentQuestion);
        updateProgress();
        updateNavigationButtons();
    }
}

function showQuestion(questionNumber) {
    console.log('Showing question:', questionNumber); // Debug log
    
    document.querySelectorAll('.question').forEach(q => {
        q.classList.remove('active');
    });
    
    const currentQuestion = document.getElementById(`question${questionNumber}`);
    if (currentQuestion) {
        currentQuestion.classList.add('active');
        console.log('Activated question:', questionNumber); // Debug log
    }
    
    const moodOptions = currentQuestion.querySelector('.mood-options');
    if (moodOptions) {
        const questionType = moodOptions.dataset.question;
        const selectedValue = questionnaireState.answers[questionType];
        
        console.log('Question type:', questionType, 'Selected value:', selectedValue); // Debug log
        
        moodOptions.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.value === selectedValue) {
                btn.classList.add('selected');
            }
        });
    }
}

function updateProgress() {
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    
    if (progressText) {
        const currentLang = document.documentElement.getAttribute('data-lang') || 'en';
        const langKey = currentLang === 'sw' ? 'sw' : 'en';
        progressText.textContent = progressText.getAttribute(`data-${langKey}`) || `Question ${questionnaireState.currentQuestion} of ${questionnaireState.totalQuestions}`;
    }
    
    if (progressFill) {
        const percentage = (questionnaireState.currentQuestion / questionnaireState.totalQuestions) * 100;
        progressFill.style.width = `${percentage}%`;
    }
}

function updateNavigationButtons() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    
    if (prevBtn) {
        prevBtn.style.display = questionnaireState.currentQuestion > 1 ? 'flex' : 'none';
    }
    
    if (nextBtn) {
        const currentQuestion = document.getElementById(`question${questionnaireState.currentQuestion}`);
        const moodOptions = currentQuestion.querySelector('.mood-options');
        const questionType = moodOptions ? moodOptions.dataset.question : null;
        const hasAnswer = questionType && questionnaireState.answers[questionType];
        
        console.log('Navigation check:', { 
            currentQuestion: questionnaireState.currentQuestion, 
            questionType, 
            hasAnswer,
            answers: questionnaireState.answers 
        }); // Debug log
        
        nextBtn.disabled = !hasAnswer;
        nextBtn.classList.toggle('active', hasAnswer);
    }
}

function showDiscoverButton() {
    hideElement('nextBtn');
    hideElement('prevBtn');
    showElement('discoverBtn');
}

function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'block';
    }
}

async function handleDiscover() {
    if (questionnaireState.isProcessing) return;
    
    questionnaireState.isProcessing = true;
    
    hideElement('discoverBtn');
    showElement('analysis-text');
    document.getElementById('analysis-text').classList.add('show');
    
    try {
        const apiParams = buildTMDBParams();
        const movie = await fetchMovieRecommendation(apiParams);
        
        if (movie) {
            showRecommendationModal(movie);
        } else {
            showErrorState();
        }
    } catch (error) {
        console.error('Error fetching recommendation:', error);
        showErrorState();
    } finally {
        questionnaireState.isProcessing = false;
    }
}

function buildTMDBParams() {
    const params = {};
    
    // Send questionnaire answers to Django API
    Object.entries(questionnaireState.answers).forEach(([questionType, answer]) => {
        params[questionType] = answer;
    });
    
    return params;
}

async function fetchMovieRecommendation(params) {
    try {
        // Use Django API endpoint instead of calling TMDB directly
        const response = await fetch('/api/movie-recommendation/?' + new URLSearchParams(params));
        const data = await response.json();
        
        if (data.success && data.movie) {
            return data.movie;
        } else {
            console.error('No movie found:', data.error);
            return null;
        }
    } catch (error) {
        console.error('Error fetching movie:', error);
        return null;
    }
}

function showRecommendationModal(movie) {
    hideElement('analysis-text');
    populateRecommendationModal(movie);
    
    const modal = document.getElementById('movieRecommendationModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

function populateRecommendationModal(movie) {
    const titleElement = document.getElementById('recommendationTitle');
    if (titleElement) {
        titleElement.textContent = movie.title || movie.name || 'Unknown Title';
    }
    
    const metaElement = document.getElementById('recommendationMeta');
    if (metaElement) {
        const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
        const rating = movie.vote_average?.toFixed(1) || 'N/A';
        const duration = movie.runtime ? `${movie.runtime} min` : 'N/A';
        
        metaElement.innerHTML = `
            <span class="year">${year}</span>
            <span class="duration">${duration}</span>
            <span class="rating"><i class="fas fa-star"></i> ${rating}</span>
        `;
    }
    
    const descElement = document.getElementById('recommendationDescription');
    if (descElement) {
        descElement.textContent = movie.overview || 'No description available.';
    }
    
    const posterElement = document.getElementById('recommendationPoster');
    if (posterElement) {
        if (movie.poster_path) {
            posterElement.innerHTML = `<img src="${TMDB_IMAGE_BASE}${movie.poster_path}" alt="${movie.title}" onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:3rem;\\'>🎬</div>'">`;
        } else {
            posterElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:3rem;">🎬</div>';
        }
    }
    
    const tagsElement = document.getElementById('recommendationTags');
    if (tagsElement && movie.genre_ids) {
        const genreNames = getGenreNames(movie.genre_ids);
        tagsElement.innerHTML = genreNames.map(genre => 
            `<span class="movie-tag">${genre}</span>`
        ).join('');
    }
    
    if (movie.id) {
        document.getElementById('watchTrailerBtn').dataset.movieId = movie.id;
    }
}

function getGenreNames(genreIds) {
    const genreMap = {
        28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
        80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
        14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
        9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
        53: 'Thriller', 10752: 'War', 37: 'Western'
    };
    
    return genreIds.slice(0, 3).map(id => genreMap[id] || 'Unknown').filter(Boolean);
}

function closeRecommendationModal() {
    const modal = document.getElementById('movieRecommendationModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function resetQuestionnaire() {
    closeRecommendationModal();
    
    questionnaireState = {
        currentQuestion: 1,
        totalQuestions: 5,
        answers: {},
        isProcessing: false
    };
    
    showQuestion(1);
    updateProgress();
    updateNavigationButtons();
    
    showElement('nextBtn');
    showElement('prevBtn');
    hideElement('discoverBtn');
    hideElement('analysis-text');
    hideElement('recommendationPreview');
}

function showErrorState() {
    hideElement('analysis-text');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-state';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <p>Sorry, we couldn't find a perfect match right now. Please try again!</p>
        <button class="btn btn-primary" onclick="resetQuestionnaire()">Try Again</button>
    `;
    
    const questionnaireCard = document.querySelector('.questionnaire-card');
    if (questionnaireCard) {
        questionnaireCard.appendChild(errorDiv);
    }
}

async function handleWatchTrailer() {
    const movieId = document.getElementById('watchTrailerBtn').dataset.movieId;
    if (!movieId) return;
    
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=en-US`);
        const data = await response.json();
        
        const trailer = data.results?.find(video => 
            video.site === 'YouTube' && 
            (video.type === 'Trailer' || video.type === 'Teaser')
        );
        
        if (trailer) {
            window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
        } else {
            alert('No trailer available for this movie.');
        }
    } catch (error) {
        console.error('Error fetching trailer:', error);
        alert('Unable to load trailer. Please try again.');
    }
}

function updateLanguage(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    
    document.querySelectorAll('[data-en][data-sw]').forEach(element => {
        const key = lang === 'sw' ? 'sw' : 'en';
        const text = element.getAttribute(`data-${key}`);
        if (text) {
            element.textContent = text;
        }
    });
    
    updateProgress();
}

window.resetQuestionnaire = resetQuestionnaire;
window.updateLanguage = updateLanguage; 

// ShowcaseManager for redesigned showcase section
class ShowcaseManager {
    constructor() {
        console.log('🎬 Initializing ShowcaseManager...');
        
        this.moviesCarousel = new InfiniteCarousel(
            '#movies-carousel', 
            'movie',
            this.createCard.bind(this)
        );
        
        this.tvCarousel = new InfiniteCarousel(
            '#tv-carousel',
            'tv',
            this.createCard.bind(this)
        );
        
        this.init();
    }

    init() {
        this.setupNavigationControls();
        this.setupMobileCardInteractions();
    }

    setupNavigationControls() {
        // Movies navigation
        document.getElementById('moviesPrevArrow')?.addEventListener('click', () => {
            this.moviesCarousel.scrollLeft();
        });
        
        document.getElementById('moviesNextArrow')?.addEventListener('click', () => {
            this.moviesCarousel.scrollRight();
        });

        // TV Shows navigation
        document.getElementById('tvPrevArrow')?.addEventListener('click', () => {
            this.tvCarousel.scrollLeft();
        });
        
        document.getElementById('tvNextArrow')?.addEventListener('click', () => {
            this.tvCarousel.scrollRight();
        });
    }

    setupMobileCardInteractions() {
        // Handle mobile card interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.movie-card')) {
                const card = e.target.closest('.movie-card');
                if (window.innerWidth <= 768) {
                    this.handleMobileCardClick(card);
                }
            }
        });
    }

    handleMobileCardClick(card) {
        card.classList.add('flipped');
        
        // Add close button if not exists
        if (!card.querySelector('.close-btn')) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-btn mobile-only';
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                card.classList.remove('flipped');
            });
            card.querySelector('.card-back').appendChild(closeBtn);
        }
    }

    createCard(item, mediaType) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.dataset.id = item.id;
        card.dataset.type = mediaType;
        
        const title = item.title || item.name;
        const posterPath = item.poster_path ? 
            `https://image.tmdb.org/t/p/w500${item.poster_path}` : 
            'https://via.placeholder.com/200x300/333/666?text=No+Image';
        
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <img src="${posterPath}" 
                         alt="${title}" 
                         class="poster-image"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/200x300/333/666?text=No+Image'">
                    <div class="card-meta">
                        <span class="genre">${this.getGenreName(item.genre_ids?.[0])}</span>
                        ${mediaType === 'tv' ? '<span class="tv-badge">TV</span>' : ''}
                        <span class="rating">⭐ ${item.vote_average?.toFixed(1) || 'N/A'}</span>
                        <span class="year">${this.getYear(item.release_date || item.first_air_date)}</span>
                    </div>
                </div>
                <div class="card-back">
                    <button class="close-btn mobile-only" style="display: none;">&times;</button>
                    <h3 class="movie-title">${title}</h3>
                    <p class="movie-description">${item.overview || 'No description available.'}</p>
                    <div class="movie-details-grid">
                        <div><strong>Rating:</strong> ${item.vote_average?.toFixed(1) || 'N/A'}</div>
                        <div><strong>Year:</strong> ${this.getYear(item.release_date || item.first_air_date)}</div>
                        <div><strong>Genre:</strong> ${this.getGenreName(item.genre_ids?.[0])}</div>
                    </div>
                    <button class="watch-trailer-btn" onclick="showTrailerModal(${item.id}, '${mediaType}')">
                        <i class="fas fa-play"></i> Watch Trailer
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    getGenreName(genreId) {
        const genres = {
            28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
            80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
            14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
            9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
            10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
        };
        return genres[genreId] || 'Other';
    }

    getYear(dateString) {
        if (!dateString) return 'N/A';
        return dateString.split('-')[0];
    }
}

// InfiniteCarousel class for handling infinite scroll
class InfiniteCarousel {
    constructor(containerId, mediaType, createCardCallback) {
        console.log(`🎠 Creating InfiniteCarousel for ${mediaType} at ${containerId}`);
        
        this.container = document.querySelector(containerId);
        this.mediaType = mediaType;
        this.createCard = createCardCallback;
        this.currentPage = 1;
        this.isLoading = false;
        this.hasMore = true;
        
        if (!this.container) {
            console.error(`❌ Container not found: ${containerId}`);
            return;
        }
        
        console.log(`✅ Container found for ${mediaType}:`, this.container);
        this.init();
    }

    async init() {
        this.showSkeletonLoading();
        await this.loadInitialContent();
        this.setupIntersectionObserver();
    }

    showSkeletonLoading() {
        // Clear container and add skeleton cards
        this.container.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const skeletonCard = document.createElement('div');
            skeletonCard.className = 'movie-card skeleton-card';
            skeletonCard.innerHTML = `
                <div class="skeleton-poster"></div>
                <div class="skeleton-content">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-meta">
                        <div class="skeleton-year"></div>
                        <div class="skeleton-rating"></div>
                    </div>
                </div>
            `;
            this.container.appendChild(skeletonCard);
        }
    }

    async loadInitialContent() {
        await this.loadMore();
    }

    async loadMore() {
        if (this.isLoading || !this.hasMore) return;
        
        this.isLoading = true;
        this.showLoading();
        
        try {
            const items = await this.fetchPage(this.currentPage);
            if (items.length === 0) {
                this.hasMore = false;
            } else {
                // Remove skeleton cards on first load
                if (this.currentPage === 1) {
                    this.container.innerHTML = '';
                }
                this.appendItems(items);
                this.currentPage++;
            }
        } catch (error) {
            console.error('Error loading content:', error);
            // Show error state
            this.showError();
        } finally {
            this.hideLoading();
            this.isLoading = false;
        }
    }

    async fetchPage(page) {
        const TMDB_API_KEY = window.TMDB_API_KEY || 'b6e814a0b9ff291122e8a05a0f206cd8';
        const url = `https://api.themoviedb.org/3/trending/${this.mediaType}/week?api_key=${TMDB_API_KEY}&page=${page}`;
        
        console.log(`🌐 Fetching ${this.mediaType} page ${page}:`, url);
        console.log(`🔑 Using API key:`, TMDB_API_KEY ? 'Available' : 'Missing');
        
        try {
            const response = await fetch(url);
            console.log(`📡 Response status:`, response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`📊 Loaded ${data.results?.length || 0} ${this.mediaType} items`);
            return data.results || [];
        } catch (error) {
            console.error(`❌ Error fetching ${this.mediaType} page ${page}:`, error);
            throw error;
        }
    }

    showError() {
        this.container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load content. Please try again later.</p>
            </div>
        `;
    }

    appendItems(items) {
        items.forEach(item => {
            const card = this.createCard(item, this.mediaType);
            this.container.appendChild(card);
        });
    }

    showLoading() {
        const loading = this.container.querySelector('.loading-indicator');
        if (loading) loading.classList.remove('hidden');
    }

    hideLoading() {
        const loading = this.container.querySelector('.loading-indicator');
        if (loading) loading.classList.add('hidden');
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoading) {
                    this.loadMore();
                }
            });
        }, { threshold: 0.1 });

        // Observe the last card for infinite scroll
        const observeLastCard = () => {
            const cards = this.container.querySelectorAll('.movie-card');
            if (cards.length > 0) {
                observer.observe(cards[cards.length - 1]);
            }
        };

        // Initial observation
        observeLastCard();

        // Observe new cards as they're added
        const mutationObserver = new MutationObserver(() => {
            observeLastCard();
        });

        mutationObserver.observe(this.container, { childList: true });
    }

    scrollLeft() {
        this.container.scrollBy({ left: -300, behavior: 'smooth' });
    }

    scrollRight() {
        this.container.scrollBy({ left: 300, behavior: 'smooth' });
    }
}

// Initialize ShowcaseManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 Checking for showcase section...');
    const showcase = document.querySelector('.showcase');
    if (showcase) {
        console.log('✅ Found showcase section, initializing ShowcaseManager...');
        try {
            new ShowcaseManager();
            console.log('✅ ShowcaseManager initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing ShowcaseManager:', error);
        }
    } else {
        console.log('❌ Showcase section not found');
    }
}); 