/**
 * Translation Service - Handles translation between English and Swahili
 */

class TranslateService {
    constructor() {
        this.currentLang = document.body.getAttribute('data-lang') || 'en';
        this.translations = {};
        this.initialized = false;
        this.init();
    }
    
    init() {
        // Load translations
        this.loadTranslations();
        
        // Setup language toggle
        this.setupLanguageToggle();
        
        // Apply initial translation
        this.translatePage(this.currentLang);
        
        this.initialized = true;
        console.log('🌐 Translation service initialized');
    }

    loadTranslations() {
        // Default translations for common UI elements
        this.translations = {
            en: {
                "Home": "Home",
                "Discover": "Discover",
                "My Movies": "My Movies",
                "Profile": "Profile",
                "Login": "Login",
                "Register": "Register"
            },
            sw: {
                "Home": "Nyumbani",
                "Discover": "Gundua",
                "My Movies": "Filamu Zangu",
                "Profile": "Wasifu",
                "Login": "Ingia",
                "Register": "Jiandikishe"
            }
        };
    }

    setupLanguageToggle() {
        const langToggle = document.getElementById('languageToggle');
        if (!langToggle) return;
        
        langToggle.addEventListener('click', () => {
            const currentLang = document.body.getAttribute('data-lang') || 'en';
            const newLang = currentLang === 'en' ? 'sw' : 'en';
            
            // Update language attribute
            document.body.setAttribute('data-lang', newLang);
            
            // Update toggle button text
            const span = langToggle.querySelector('span');
            if (span) {
                span.textContent = newLang === 'en' ? 'SW' : 'EN';
            }
            
            // Translate the page
            this.translatePage(newLang);
            
            // Save preference
            localStorage.setItem('language', newLang);
        });
    }

    translatePage(lang) {
        if (!lang || (lang !== 'en' && lang !== 'sw')) {
            lang = 'en';
        }
        
        // Update current language
        this.currentLang = lang;
        
        // Translate elements with data-en/data-sw attributes
        document.querySelectorAll('[data-en][data-sw]').forEach(el => {
            const translation = el.getAttribute(`data-${lang}`);
            if (translation) {
                // For input elements, handle placeholder separately
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    if (el.getAttribute('placeholder')) {
                        el.placeholder = translation;
                    } else {
                        el.value = translation;
                    }
                } else {
                    el.textContent = translation;
                }
            }
        });
        
        // Translate form placeholders
        document.querySelectorAll(`[data-placeholder-${lang}]`).forEach(el => {
            const placeholderText = el.getAttribute(`data-placeholder-${lang}`);
            if (placeholderText) {
                el.placeholder = placeholderText;
            }
        });
    }
}

// Initialize the translation service
document.addEventListener('DOMContentLoaded', () => {
    window.translateService = new TranslateService();
});