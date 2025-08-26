// Add responsive poster functions
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
window.openTrailerModal = openTrailerModal;
window.closeTrailerModal = closeTrailerModal;