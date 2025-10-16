/**
 * Auto Update HTML Files
 * Script untuk update semua HTML files agar menggunakan modular structure
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Auto-updating HTML files to use modular structure...\n');

// HTML files to update
const htmlFiles = [
    'public/index.html',
    'public/materials.html',
    'public/products.html',
    'public/orders.html',
    'public/production.html',
    'public/customers.html',
    'public/suppliers.html',
    'public/purchase-orders.html',
    'public/sales-orders.html',
    'public/shipments.html',
    'public/payments.html',
    'public/quality-control.html',
    'public/reports.html',
    'public/dashboard.html',
    'public/user-management.html',
    'public/profile.html'
];

// Old script tags to replace
const oldScripts = [
    '<script src="/js/config.js"></script>',
    '<script src="/js/main.js"></script>',
    '<script src="/js/auth.js"></script>',
    '<script src="/js/permissions.js"></script>',
    '<script src="/js/sidebar.js"></script>',
    '<script src="/js/i18n.js"></script>'
];

// New script tags
const newScripts = `
    <!-- Modular JavaScript Modules -->
    <script src="/js/modules/loader.js"></script>
    <script src="/js/modules/legacy.js"></script>
    
    <!-- Legacy files (optional, for backward compatibility) -->
    <script src="/js/sidebar.js"></script>
    <script src="/js/i18n.js"></script>
`;

let updatedCount = 0;
let skippedCount = 0;
let errorCount = 0;

htmlFiles.forEach(filePath => {
    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log(`⏭️  Skipped: ${filePath} (not found)`);
            skippedCount++;
            return;
        }

        // Read file
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Check if already using modular structure
        if (content.includes('/js/modules/loader.js')) {
            console.log(`✅ Already updated: ${filePath}`);
            skippedCount++;
            return;
        }

        // Remove old script tags
        oldScripts.forEach(oldScript => {
            if (content.includes(oldScript)) {
                content = content.replace(oldScript, '');
                modified = true;
            }
        });

        // Add new script tags before </body>
        if (content.includes('</body>')) {
            content = content.replace('</body>', `${newScripts}\n</body>`);
            modified = true;
        }

        if (modified) {
            // Backup original file
            const backupPath = filePath + '.backup';
            fs.copyFileSync(filePath, backupPath);
            
            // Write updated content
            fs.writeFileSync(filePath, content, 'utf8');
            
            console.log(`✅ Updated: ${filePath}`);
            console.log(`   Backup: ${backupPath}`);
            updatedCount++;
        } else {
            console.log(`⏭️  No changes: ${filePath}`);
            skippedCount++;
        }

    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
        errorCount++;
    }
});

console.log('\n' + '='.repeat(60));
console.log('📊 Summary:');
console.log('='.repeat(60));
console.log(`✅ Updated: ${updatedCount} files`);
console.log(`⏭️  Skipped: ${skippedCount} files`);
console.log(`❌ Errors: ${errorCount} files`);
console.log('='.repeat(60));

if (updatedCount > 0) {
    console.log('\n💡 Tips:');
    console.log('1. Test each updated page to ensure it works');
    console.log('2. Original files backed up with .backup extension');
    console.log('3. To rollback: rename .backup files back to .html');
    console.log('4. After testing, delete .backup files');
}

console.log('\n🎉 Done!\n');
