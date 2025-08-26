#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the original file
const filePath = path.join(__dirname, 'static', 'js', 'home.js');
let content = fs.readFileSync(filePath, 'utf8');

// Add responsive poster functions after the TMDB configuration
const responsiveFunctions = `
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
    
    return \`https://image.tmdb.org/t/p/\${optimalSize}\${posterPath}\`;
}

function getModalPosterUrl(posterPath) {
    if (!posterPath) return '/static/logo.kakaflix.jpg';
    
    // For modal, always use high quality
    const screenWidth = window.innerWidth;
    let modalSize = 'w780'; // default high quality
    
    if (screenWidth < 768) {
        modalSize = 'w500'; // smaller for mobile modals
    }
    
    return \`https://image.tmdb.org/t/p/\${modalSize}\${posterPath}\`;
}

// Update the existing getOptimalPoster function to be more responsive
function getOptimalPoster(posterPath) {
    return getResponsivePosterUrl(posterPath);
}

`;

// Insert the functions after TMDB configuration
const insertAfter = 'const TMDB_IMAGE_BASE_ORIGINAL = \'https://image.tmdb.org/t/p/original\';';
const insertIndex = content.indexOf(insertAfter) + insertAfter.length;
content = content.slice(0, insertIndex) + responsiveFunctions + content.slice(insertIndex);

// Update the showMovieModal function to use two-poster structure
const oldModalPoster = 'modalPoster.innerHTML = `<img src="${posterUrl}" alt="${movie.title || movie.name}" onerror="this.src=\'/static/logo.kakaflix.jpg\'">`;';
const newModalPoster = `modalPoster.innerHTML = \`
            <div class="modal-poster-container">
                <div class="modal-poster-outer">
                    <img src="\${posterUrl}" alt="\${movie.title || movie.name}" onerror="this.src='/static/logo.kakaflix.jpg'">
                </div>
                <div class="modal-poster-inner">
                    <img src="\${posterUrl}" alt="\${movie.title || movie.name}" onerror="this.src='/static/logo.kakaflix.jpg'">
                </div>
            </div>
        \`;`;

content = content.replace(oldModalPoster, newModalPoster);

// Update the poster URL to use responsive function
const oldPosterUrl = 'const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : \'/static/logo.kakaflix.jpg\';';
const newPosterUrl = 'const posterUrl = movie.poster_path ? getModalPosterUrl(movie.poster_path) : \'/static/logo.kakaflix.jpg\';';

content = content.replace(oldPosterUrl, newPosterUrl);

// Add trailer modal functions at the end
const trailerFunctions = `

// Function to open trailer modal
function openTrailerModal(trailerUrl, title) {
    // Create modal if it doesn't exist
    let trailerModal = document.getElementById('trailerModal');
    if (!trailerModal) {
        trailerModal = document.createElement('div');
        trailerModal.id = 'trailerModal';
        trailerModal.className = 'trailer-modal';
        trailerModal.innerHTML = \`
            <div class="trailer-modal-content">
                <div class="trailer-modal-header">
                    <h3 id="trailerTitle">\${title}</h3>
                    <button class="trailer-close-btn" onclick="closeTrailerModal()">&times;</button>
                </div>
                <div class="trailer-modal-body">
                    <iframe id="trailerIframe" src="" frameborder="0" allowfullscreen></iframe>
                </div>
            </div>
        \`;
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
`;

content += trailerFunctions;

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Successfully updated home.js with responsive poster functions and modal improvements!');