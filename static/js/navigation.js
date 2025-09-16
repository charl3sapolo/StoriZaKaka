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
                
                // Show notification on active change
                this.showThemeToast(newTheme);
            });
        }
    }
    
    showThemeToast(theme) {
        this.showNotification({
            icon: theme === 'dark' ? '🌙' : '☀️',
            text: `Switched to ${theme} mode`
        });
    }

    // Language System - Use TranslateService if available
    initializeLanguageSystem() {
        const langToggle = document.getElementById('languageToggle');
        const rootElement = document.body;

        // If TranslateService is available, let it handle language switching
        if (window.translateService) {
            console.log('🌐 Using TranslateService for language handling');
            return;
        }
        
        // Fallback if TranslateService is not available
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
                
                // Show notification on active change
                this.showLanguageToast(newLang);
                
                // Update auth links with new language
                if (window.updateAuthLinks) {
                    window.updateAuthLinks();
                }
            });
        }
    }
    
    showLanguageToast(lang) {
        const languages = {
            'en': { name: 'English', flag: '🇺🇸' },
            'sw': { name: 'Kiswahili', flag: '🇹🇿' }
        };
        
        this.showNotification({
            icon: languages[lang].flag,
            text: `Switched to ${languages[lang].name}`
        });
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
        const savedTheme = localStorage.getItem('theme') || 'dark';
        const savedLang = localStorage.getItem('language') || 'en';
        const rootElement = document.body;

        // Apply theme without showing notification
        rootElement.setAttribute('data-theme', savedTheme);
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.querySelector('.theme-icon').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
        }

        // Apply language without showing notification
        rootElement.setAttribute('data-lang', savedLang);
        const langToggle = document.getElementById('languageToggle');
        if (langToggle) {
            langToggle.querySelector('span').textContent = savedLang === 'en' ? 'SW' : 'EN';
        }
        this.updateLanguageElements(savedLang);
        
        // Update auth links based on current authentication status
        if (window.updateAuthLinks) {
            window.updateAuthLinks();
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
    
    // Unified notification system with mobile responsiveness
    showNotification({icon, text, position = 'top'}) {
        const toast = document.createElement('div');
        toast.className = 'dynamic-toast';
        
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icon}</span>
                <span class="toast-text">${text}</span>
            </div>
        `;
        
        // Mobile-responsive styles
        const isMobile = window.innerWidth <= 768;
        const mobileStyles = isMobile ? `
            width: calc(100% - 40px);
            right: 20px;
            left: 20px;
            top: ${position === 'top' ? '20px' : 'auto'};
            bottom: ${position === 'bottom' ? '20px' : 'auto'};
        ` : `
            min-width: 280px;
            max-width: 320px;
            top: ${position === 'top' ? '20px' : 'auto'};
            bottom: ${position === 'bottom' ? '20px' : 'auto'};
            right: 20px;
        `;
        
        // Apply styles
        toast.style.cssText = `
            position: fixed;
            z-index: 10000;
            background: rgba(33, 33, 33, 0.95);
            color: #fff;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            justify-content: flex-start;
            transform: translateY(-20px);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
            ${mobileStyles}
        `;
        
        // Toast content styles
        const toastContent = toast.querySelector('.toast-content');
        toastContent.style.cssText = `
            display: flex;
            align-items: center;
            width: 100%;
        `;
        
        // Icon styles
        const toastIcon = toast.querySelector('.toast-icon');
        toastIcon.style.cssText = `
            font-size: 20px;
            margin-right: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Text styles
        const toastText = toast.querySelector('.toast-text');
        toastText.style.cssText = `
            font-size: 14px;
            font-weight: 500;
        `;
        
        // Add to DOM and animate in
        document.body.appendChild(toast);
        
        // Force reflow to ensure animation works
        toast.offsetHeight;
        
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
        
        // Remove after delay
        setTimeout(() => {
            toast.style.transform = 'translateY(-20px)';
            toast.style.opacity = '0';
            
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
});

// Export for use in other scripts
window.NavigationManager = NavigationManager;
