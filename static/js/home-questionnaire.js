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