/**
 * Module Loader
 * Load semua modul modular secara berurutan
 * 
 * File ini harus di-include di semua HTML file setelah config.js
 * 
 * Usage:
 * <script src="/js/modules/loader.js"></script>
 */

(function() {
    'use strict';

    console.log('📦 Loading Modular Modules...');

    const modules = [
        // 1. Config (must be first)
        '/js/modules/config/app.js',
        
        // 2. Constants
        '/js/modules/constants/roles.js',
        '/js/modules/constants/status.js',
        
        // 3. Utils
        '/js/modules/utils/storage.js',
        '/js/modules/utils/validation.js',
        '/js/modules/utils/formatter.js',
        '/js/modules/utils/date.js',
        
        // 4. UI Components (Toast must be before UIUtil)
        '/js/modules/ui/toast.js',
        '/js/modules/ui/utils.js',
        '/js/modules/ui/theme-manager.js',
        
        // 5. Services (must be last, depends on utils and ui)
        '/js/modules/services/api.js',
        '/js/modules/services/auth.js'
    ];

    // Load modules sequentially
    let loadedCount = 0;

    function loadModule(index) {
        if (index >= modules.length) {
            console.log('✅ All modular modules loaded successfully!');
            console.log(`   Total modules: ${loadedCount}`);
            
            // Dispatch event when all modules are loaded
            const event = new CustomEvent('modulesLoaded', { 
                detail: { 
                    count: loadedCount,
                    modules: modules 
                } 
            });
            window.dispatchEvent(event);
            return;
        }

        const script = document.createElement('script');
        script.src = modules[index];
        script.onload = function() {
            loadedCount++;
            if (AppConfig && AppConfig.debug.enabled) {
                console.log(`   ✓ Loaded: ${modules[index]}`);
            }
            loadModule(index + 1);
        };
        script.onerror = function() {
            console.error(`   ✕ Failed to load: ${modules[index]}`);
            loadModule(index + 1); // Continue even if one fails
        };
        document.head.appendChild(script);
    }

    // Start loading
    loadModule(0);
})();
