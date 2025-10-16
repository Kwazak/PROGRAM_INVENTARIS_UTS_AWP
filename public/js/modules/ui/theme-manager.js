/**
 * Dark Mode / Theme Manager Module
 * Manages light and dark theme toggling
 */

const ThemeManager = {
    // Theme constants
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
        AUTO: 'auto'
    },

    // Storage key
    STORAGE_KEY: 'app-theme',

    // Initialize theme manager
    init() {
        this.loadTheme();
        this.createToggleButton();
        this.setupListeners();
        console.log('🎨 Theme Manager initialized');
    },

    // Get current theme
    getCurrentTheme() {
        return localStorage.getItem(this.STORAGE_KEY) || this.THEMES.AUTO;
    },

    // Get effective theme (resolves AUTO)
    getEffectiveTheme() {
        const saved = this.getCurrentTheme();
        
        if (saved === this.THEMES.AUTO) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches 
                ? this.THEMES.DARK 
                : this.THEMES.LIGHT;
        }
        
        return saved;
    },

    // Load and apply theme
    loadTheme() {
        const theme = this.getEffectiveTheme();
        this.applyTheme(theme);
    },

    // Apply theme to document
    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === this.THEMES.DARK) {
            root.classList.add('dark-mode');
            root.classList.remove('light-mode');
        } else {
            root.classList.add('light-mode');
            root.classList.remove('dark-mode');
        }

        // Update meta theme-color
        this.updateMetaThemeColor(theme);
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    },

    // Update meta theme color for mobile browsers
    updateMetaThemeColor(theme) {
        let metaTheme = document.querySelector('meta[name="theme-color"]');
        
        if (!metaTheme) {
            metaTheme = document.createElement('meta');
            metaTheme.name = 'theme-color';
            document.head.appendChild(metaTheme);
        }

        metaTheme.content = theme === this.THEMES.DARK ? '#1f2937' : '#2563eb';
    },

    // Set theme
    setTheme(theme) {
        if (!Object.values(this.THEMES).includes(theme)) {
            console.error('Invalid theme:', theme);
            return;
        }

        localStorage.setItem(this.STORAGE_KEY, theme);
        this.loadTheme();
        this.updateToggleButton();
    },

    // Toggle between light and dark
    toggle() {
        const current = this.getEffectiveTheme();
        const newTheme = current === this.THEMES.DARK ? this.THEMES.LIGHT : this.THEMES.DARK;
        this.setTheme(newTheme);
    },

    // Create toggle button in topbar
    createToggleButton() {
        const topbar = document.querySelector('.topbar-right') || document.querySelector('.topbar');
        if (!topbar) return;

        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'btn-icon theme-toggle';
        button.setAttribute('aria-label', 'Toggle theme');
        button.setAttribute('title', 'Toggle theme');
        button.onclick = () => this.toggle();

        this.updateToggleButtonIcon(button);
        
        // Insert before first child or append
        if (topbar.firstChild) {
            topbar.insertBefore(button, topbar.firstChild);
        } else {
            topbar.appendChild(button);
        }
    },

    // Update toggle button icon
    updateToggleButton() {
        const button = document.getElementById('theme-toggle');
        if (button) {
            this.updateToggleButtonIcon(button);
        }
    },

    // Update button icon based on theme
    updateToggleButtonIcon(button) {
        const theme = this.getEffectiveTheme();
        const icon = theme === this.THEMES.DARK 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
        
        button.innerHTML = icon;
        button.setAttribute('title', theme === this.THEMES.DARK ? 'Switch to light mode' : 'Switch to dark mode');
    },

    // Setup event listeners
    setupListeners() {
        // Listen for system theme changes
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        darkModeQuery.addEventListener('change', (e) => {
            if (this.getCurrentTheme() === this.THEMES.AUTO) {
                this.loadTheme();
            }
        });

        // Keyboard shortcut (Ctrl/Cmd + Shift + L)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                this.toggle();
            }
        });
    }
};

// Export for use in other modules
window.ThemeManager = ThemeManager;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
    ThemeManager.init();
}
