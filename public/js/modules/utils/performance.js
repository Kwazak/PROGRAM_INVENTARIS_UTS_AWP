/**
 * Performance Optimization Module
 * Lazy loading, code splitting, and performance enhancements
 */

const Performance = {
    /**
     * Lazy load images with intersection observer
     */
    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');

        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for browsers without IntersectionObserver
            images.forEach(img => {
                img.src = img.dataset.src;
            });
        }
    },

    /**
     * Lazy load JavaScript modules
     */
    async lazyLoadModule(modulePath, exportName = 'default') {
        try {
            const module = await import(modulePath);
            return module[exportName] || module;
        } catch (error) {
            console.error(`Failed to lazy load module: ${modulePath}`, error);
            throw error;
        }
    },

    /**
     * Debounce function calls
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    /**
     * Throttle function calls
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Preload critical resources
     */
    preloadCriticalResources() {
        const criticalResources = [
            // Add critical CSS/JS files here
            '/css/style.css',
            '/js/main.js'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            document.head.appendChild(link);
        });
    },

    /**
     * Optimize table rendering for large datasets
     */
    optimizeTableRendering(tableElement, options = {}) {
        const {
            virtualScroll = false,
            pageSize = 50,
            bufferSize = 10
        } = options;

        if (!virtualScroll) return;

        // Virtual scrolling implementation
        const rows = Array.from(tableElement.querySelectorAll('tbody tr'));
        const tableHeight = tableElement.offsetHeight;
        const rowHeight = rows[0]?.offsetHeight || 40;

        let scrollTop = 0;
        let visibleStart = 0;
        let visibleEnd = Math.min(pageSize, rows.length);

        const updateVisibleRows = () => {
            visibleStart = Math.floor(scrollTop / rowHeight);
            visibleEnd = Math.min(visibleStart + pageSize + bufferSize, rows.length);

            rows.forEach((row, index) => {
                if (index >= visibleStart && index < visibleEnd) {
                    row.style.display = '';
                    row.style.transform = `translateY(${(index - visibleStart) * rowHeight}px)`;
                } else {
                    row.style.display = 'none';
                }
            });
        };

        tableElement.addEventListener('scroll', this.throttle(() => {
            scrollTop = tableElement.scrollTop;
            updateVisibleRows();
        }, 16)); // ~60fps

        updateVisibleRows();
    },

    /**
     * Cache API responses
     */
    apiCache: new Map(),

    cacheAPIResponse(key, data, ttl = 300000) { // 5 minutes default
        this.apiCache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });
    },

    getCachedAPIResponse(key) {
        const cached = this.apiCache.get(key);
        if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
            return cached.data;
        }
        this.apiCache.delete(key);
        return null;
    },

    /**
     * Optimize fetchAPI with caching
     */
    async fetchAPIOptimized(endpoint, options = {}, useCache = true) {
        const cacheKey = `${endpoint}_${JSON.stringify(options)}`;

        if (useCache) {
            const cached = this.getCachedAPIResponse(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const result = await window.fetchAPI(endpoint, options);

        if (useCache && result) {
            this.cacheAPIResponse(cacheKey, result);
        }

        return result;
    },

    /**
     * Monitor performance metrics
     */
    monitorPerformance() {
        if ('performance' in window && 'PerformanceObserver' in window) {
            // Monitor Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.startTime);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Monitor First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    console.log('FID:', entry.processingStart - entry.startTime);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // Monitor Cumulative Layout Shift
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                console.log('CLS:', clsValue);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
    },

    /**
     * Optimize bundle loading with dynamic imports
     */
    async loadPageModule(pageName) {
        try {
            const module = await import(`../pages/${pageName}.js`);
            return module.default || module;
        } catch (error) {
            console.error(`Failed to load page module: ${pageName}`, error);
            return null;
        }
    },

    /**
     * Initialize performance optimizations
     */
    init() {
        // Preload critical resources
        this.preloadCriticalResources();

        // Lazy load images
        this.lazyLoadImages();

        // Monitor performance
        this.monitorPerformance();

        // Optimize scroll performance
        let ticking = false;
        const optimizeScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    // Perform scroll optimizations here
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', optimizeScroll, { passive: true });

        console.log('Performance optimizations initialized');
    }
};

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Performance.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Performance;
}