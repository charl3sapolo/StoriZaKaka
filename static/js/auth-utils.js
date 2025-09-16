// ============================================================================
// AUTH-UTILS.JS - Authentication Utilities for StoriZaKaka
// ============================================================================

/**
 * Checks if a user is currently logged in
 * @returns {boolean} True if user is logged in, false otherwise
 */
function isUserLoggedIn() {
  // Check for user authentication indicator
  const userIndicator = document.querySelector('[data-user-id]');
  const authLinks = document.querySelectorAll('a[href*="/auth/login/"], a[href*="/accounts/login/"]');
  const logoutLinks = document.querySelectorAll('a[href*="/auth/logout/"], a[href*="/accounts/logout/"]');
  
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
  
  // Check for auth token in localStorage or sessionStorage
  if (localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')) {
    return true;
  }
  
  // Default to false if we can't determine
  return false;
}

/**
 * Updates all login/logout links based on authentication status
 */
function updateAuthLinks() {
  const isLoggedIn = isUserLoggedIn();
  
  // Update desktop navigation links
  const desktopAuthLinks = document.querySelectorAll('.nav-center a[href*="/auth/"], .nav-center a[href*="/accounts/"]');
  desktopAuthLinks.forEach(link => {
    if (isLoggedIn) {
      link.setAttribute('href', '/auth/logout/');
      link.setAttribute('data-en', 'Logout');
      link.setAttribute('data-sw', 'Ondoka');
      link.textContent = document.documentElement.getAttribute('data-lang') === 'sw' ? 'Ondoka' : 'Logout';
    } else {
      link.setAttribute('href', '/auth/login/');
      link.setAttribute('data-en', 'Login');
      link.setAttribute('data-sw', 'Ingia');
      link.textContent = document.documentElement.getAttribute('data-lang') === 'sw' ? 'Ingia' : 'Login';
    }
  });
  
  // Update mobile menu links
  const mobileAuthLinks = document.querySelectorAll('.mobile-menu .menu-item[href*="/auth/"], .mobile-menu .menu-item[href*="/accounts/"]');
  mobileAuthLinks.forEach(link => {
    const span = link.querySelector('span');
    if (isLoggedIn) {
      link.setAttribute('href', '/auth/logout/');
      link.querySelector('i').className = 'fas fa-sign-out-alt';
      if (span) {
        span.setAttribute('data-en', 'Logout');
        span.setAttribute('data-sw', 'Ondoka');
        span.textContent = document.documentElement.getAttribute('data-lang') === 'sw' ? 'Ondoka' : 'Logout';
      }
    } else {
      link.setAttribute('href', '/auth/login/');
      link.querySelector('i').className = 'fas fa-sign-in-alt';
      if (span) {
        span.setAttribute('data-en', 'Login');
        span.setAttribute('data-sw', 'Ingia');
        span.textContent = document.documentElement.getAttribute('data-lang') === 'sw' ? 'Ingia' : 'Login';
      }
    }
  });
  
  // Update any other auth-related UI elements
  document.querySelectorAll('[data-auth-status]').forEach(element => {
    if (isLoggedIn) {
      element.setAttribute('data-auth-status', 'authenticated');
    } else {
      element.setAttribute('data-auth-status', 'unauthenticated');
    }
  });
  
  // Dispatch a custom event that other components can listen for
  document.dispatchEvent(new CustomEvent('authStatusChanged', { 
    detail: { isAuthenticated: isLoggedIn } 
  }));
}

// Initialize auth status when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  updateAuthLinks();
  
  // Listen for changes in authentication status
  window.addEventListener('storage', (event) => {
    if (event.key === 'auth_token') {
      updateAuthLinks();
    }
  });
  
  // Check periodically for auth status changes (every 60 seconds)
  setInterval(updateAuthLinks, 60000);
});

// Export functions for use in other scripts
window.isUserLoggedIn = isUserLoggedIn;
window.updateAuthLinks = updateAuthLinks;
