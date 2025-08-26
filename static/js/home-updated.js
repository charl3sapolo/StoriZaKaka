// Add responsive poster functions at the beginning
function getResponsivePosterUrl(posterPath, size = 'w500') {
    if (!posterPath) return '/static/logo.kakaflix.jpg';
    
    // Get screen width for responsive sizing
    const screenWidth = window.innerWidth;
    let optimalSize = 'w500'; // default
    
    if (screenWidth < 480) {
        optimalSize = 'w185'; // mobile
    } else if (screenWidth < 768) {
        optimalSize = 'w342'; // tablet
    } else if (screenWidth < 1024) {
        optimalSize = 'w500'; // small desktop
    } else {
        optimalSize = 'w780'; // large desktop
    }
    
    return `https://image.tmdb.org/t/p/${optimalSize}${posterPath}`;
}

function getModalPosterUrl(posterPath) {
    if (!posterPath) return '/static/logo.kakaflix.jpg';
    
    // For modal, always use high quality
    const screenWidth = window.innerWidth;
    let modalSize = 'w780'; // default high quality
    
    if (screenWidth < 768) {
        modalSize = 'w500'; // smaller for mobile modals
    }
    
    return `https://image.tmdb.org/t/p/${modalSize}${posterPath}`;
}

// Update the existing getOptimalPoster function to be more responsive
function getOptimalPoster(posterPath) {
    return getResponsivePosterUrl(posterPath);
}

// Updated showMovieModal function with two-poster structure
function showMovieModal(movie) {
    console.log('Opening modal for movie:', movie);
    
    const modal = document.getElementById('movieModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMeta = document.getElementById('modalMeta');
    const modalDesc = document.getElementById('modalDesc');
    const modalPoster = document.getElementById('modalPoster');
    const watchTrailerBtn = document.getElementById('watchTrailerBtn');
    const modalBackdrop = document.getElementById('modalBackdrop');
    
    console.log('Modal elements found:', {
        modal: !!modal,
        modalTitle: !!modalTitle,
        modalMeta: !!modalMeta,
        modalDesc: !!modalDesc,
        modalPoster: !!modalPoster,
        watchTrailerBtn: !!watchTrailerBtn,
        modalBackdrop: !!modalBackdrop
    });
    
    if (modal && modalTitle && modalMeta && modalDesc && modalPoster && watchTrailerBtn) {
        // Set movie data
        modalTitle.textContent = movie.title || movie.name || 'Unknown Title';
        modalDesc.textContent = movie.overview || 'No description available.';
        
        // Set poster with two-poster structure
        const posterUrl = movie.poster_path 
            ? getModalPosterUrl(movie.poster_path)
            : '/static/logo.kakaflix.jpg';
        modalPoster.innerHTML = `
            <div class="modal-poster-container">
                <div class="modal-poster-outer">
                    <img src="${posterUrl}" alt="${movie.title || movie.name}" onerror="this.src='/static/logo.kakaflix.jpg'">
                </div>
                <div class="modal-poster-inner">
                    <img src="${posterUrl}" alt="${movie.title || movie.name}" onerror="this.src='/static/logo.kakaflix.jpg'">
                </div>
            </div>
        `;
        
        // Set meta information
        const year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
        const rating = movie.vote_average?.toFixed(1) || 'N/A';
        const genre = getGenreName(movie.genre_ids?.[0]);
        
        modalMeta.innerHTML = `
            <span class="modal-rating">⭐ ${rating}</span>
            <span class="modal-year">${year}</span>
            <span class="modal-genre">${genre}</span>
        `;
        
        // Set trailer button
        watchTrailerBtn.setAttribute('data-movie-id', movie.id);
        watchTrailerBtn.setAttribute('data-media-type', movie.media_type || 'movie');
        watchTrailerBtn.onclick = () => watchTrailer(movie.id, movie.media_type || 'movie');
        
        // Show modal
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
            if (modalBackdrop) modalBackdrop.classList.add('show');
        }, 10);
        console.log('Modal should now be visible');
    } else {
        console.error('Movie modal elements not found');
    }
}

// Updated watchTrailer function to fix trailer fetching
function watchTrailer(movieId, mediaType = 'movie') {
    console.log(`Fetching trailer for ${mediaType} ${movieId}`);
    
    const apiKey = '8c247ea0b4b56ed2ff7d41c9a833aa77';
    const url = `https://api.themoviedb.org/3/${mediaType}/${movieId}/videos?api_key=${apiKey}&language=en-US`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Trailer data:', data);
            
            if (data.results && data.results.length > 0) {
                // Find the first official trailer or teaser
                const trailer = data.results.find(video => 
                    video.type === 'Trailer' && 
                    (video.site === 'YouTube' || video.site === 'youtube')
                ) || data.results[0];
                
                if (trailer && trailer.key) {
                    const trailerUrl = `https://www.youtube.com/embed/${trailer.key}`;
                    openTrailerModal(trailerUrl, trailer.name || 'Movie Trailer');
                } else {
                    alert('No trailer available for this movie.');
                }
            } else {
                alert('No trailer available for this movie.');
            }
        })
        .catch(error => {
            console.error('Error fetching trailer:', error);
            alert('Error loading trailer. Please try again.');
        });
}

// Function to open trailer modal
function openTrailerModal(trailerUrl, title) {
    // Create modal if it doesn't exist
    let trailerModal = document.getElementById('trailerModal');
    if (!trailerModal) {
        trailerModal = document.createElement('div');
        trailerModal.id = 'trailerModal';
        trailerModal.className = 'trailer-modal';
        trailerModal.innerHTML = `
            <div class="trailer-modal-content">
                <div class="trailer-modal-header">
                    <h3 id="trailerTitle">${title}</h3>
                    <button class="trailer-close-btn" onclick="closeTrailerModal()">&times;</button>
                </div>
                <div class="trailer-modal-body">
                    <iframe id="trailerIframe" src="" frameborder="0" allowfullscreen></iframe>
                </div>
            </div>
        `;
        document.body.appendChild(trailerModal);
    }
    
    // Update content
    document.getElementById('trailerTitle').textContent = title;
    document.getElementById('trailerIframe').src = trailerUrl;
    
    // Show modal
    trailerModal.style.display = 'flex';
    setTimeout(() => trailerModal.classList.add('show'), 10);
}

// Function to close trailer modal
function closeTrailerModal() {
    const trailerModal = document.getElementById('trailerModal');
    if (trailerModal) {
        trailerModal.classList.remove('show');
        setTimeout(() => {
            trailerModal.style.display = 'none';
            // Clear iframe src to stop video
            const iframe = document.getElementById('trailerIframe');
            if (iframe) iframe.src = '';
        }, 300);
    }
}

// Global functions for external access
window.watchTrailer = watchTrailer;
window.showMovieModal = showMovieModal;
window.closeMovieModal = closeMovieModal;
window.openTrailerModal = openTrailerModal;
window.closeTrailerModal = closeTrailerModal;