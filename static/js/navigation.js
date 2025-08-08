// ============================================================================
// NAVIGATION.JS - Unified Navigation System for All Pages (Except Home)
// ============================================================================

class NavigationManager {
    constructor() {
        this.isMenuOpen = false;
        this.init();
    }

    init() {
        this.initializeThemeSystem();
        this.initializeLanguageSystem();
        this.initializeMobileMenu();
        this.loadSavedPreferences();
        this.updateMenuTime();
        this.setupEventListeners();
    }

    // Theme System
    initializeThemeSystem() {
        const themeToggle = document.getElementById('themeToggle');
        const rootElement = document.body;

        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = rootElement.getAttribute('data-theme') || 'dark';
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                rootElement.setAttribute('data-theme', newTheme);
                themeToggle.querySelector('.theme-icon').textContent = newTheme === 'dark' ? '🌙' : '☀️';
                localStorage.setItem('theme', newTheme);
                
                // Add visual feedback
                themeToggle.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    themeToggle.style.transform = 'scale(1)';
                }, 150);
            });
        }
    }

    // Language System
    initializeLanguageSystem() {
        const langToggle = document.getElementById('languageToggle');
        const rootElement = document.body;

        if (langToggle) {
            langToggle.addEventListener('click', () => {
                const currentLang = rootElement.getAttribute('data-lang') || 'en';
                const newLang = currentLang === 'en' ? 'sw' : 'en';
                
                rootElement.setAttribute('data-lang', newLang);
                langToggle.querySelector('span').textContent = newLang === 'en' ? 'SW' : 'EN';
                
                // Update all elements with data-en and data-sw attributes
                this.updateLanguageElements(newLang);
                localStorage.setItem('language', newLang);
                
                // Add visual feedback
                langToggle.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    langToggle.style.transform = 'scale(1)';
                }, 150);
            });
        }
    }

    updateLanguageElements(lang) {
        document.querySelectorAll('[data-en]').forEach(el => {
            const attr = `data-${lang}`;
            if (el.hasAttribute(attr)) {
                el.textContent = el.getAttribute(attr);
                
                if (el.tagName === 'INPUT' && el.hasAttribute(`${attr}-placeholder`)) {
                    el.placeholder = el.getAttribute(`${attr}-placeholder`);
                }
            }
        });
    }

    // Mobile Menu System
    initializeMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        const closeMenuBtn = document.getElementById('closeMenuBtn');

        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                this.toggleMenu();
            });

            if (closeMenuBtn) {
                closeMenuBtn.addEventListener('click', () => {
                    this.closeMenu();
                });
            }

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    this.closeMenu();
                }
            });

            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeMenu();
                }
            });
        }
    }

    toggleMenu() {
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        if (this.isMenuOpen) return;
        
        this.isMenuOpen = true;
        document.body.classList.add('menu-open');
        document.body.style.overflow = 'hidden';
        
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuBtn) {
            mobileMenuBtn.innerHTML = '<i class="fas fa-times"></i>';
            mobileMenuBtn.style.transform = 'rotate(180deg)';
        }
        
        if (mobileMenu) {
            mobileMenu.classList.add('open');
        }
        
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    closeMenu() {
        if (!this.isMenuOpen) return;
        
        this.isMenuOpen = false;
        document.body.classList.remove('menu-open');
        document.body.style.overflow = '';
        
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (mobileMenuBtn) {
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            mobileMenuBtn.style.transform = 'rotate(0deg)';
        }
        
        if (mobileMenu) {
            mobileMenu.classList.remove('open');
        }
    }

    // Menu Time Update
    updateMenuTime() {
        const menuTime = document.getElementById('menu-time');
        if (menuTime) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            
            menuTime.style.opacity = '0';
            setTimeout(() => {
                menuTime.textContent = timeString;
                menuTime.style.opacity = '1';
            }, 150);
        }
    }

    // Load Saved Preferences
    loadSavedPreferences() {
        const savedTheme = localStorage.getItem('theme');
        const savedLang = localStorage.getItem('language');
        const rootElement = document.body;

        if (savedTheme) {
            rootElement.setAttribute('data-theme', savedTheme);
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.querySelector('.theme-icon').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
            }
        }

        if (savedLang) {
            rootElement.setAttribute('data-lang', savedLang);
            const langToggle = document.getElementById('languageToggle');
            if (langToggle) {
                langToggle.querySelector('span').textContent = savedLang === 'en' ? 'SW' : 'EN';
            }
            this.updateLanguageElements(savedLang);
        }
    }

    // Setup Event Listeners
    setupEventListeners() {
        // Update menu time every minute
        setInterval(() => {
            this.updateMenuTime();
        }, 60000);

        // Touch events for mobile menu button
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                mobileMenuBtn.style.transform = 'scale(0.95)';
            }, { passive: false });

            mobileMenuBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                mobileMenuBtn.style.transform = '';
                this.toggleMenu();
            }, { passive: false });
        }
    }

    // Update saved movie count
    updateSavedCount(count) {
        const savedCountElements = document.querySelectorAll('#savedCount, #mobileSavedCount');
        savedCountElements.forEach(element => {
            if (element) {
                element.textContent = count;
            }
        });
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
});

// Export for use in other scripts
window.NavigationManager = NavigationManager;
