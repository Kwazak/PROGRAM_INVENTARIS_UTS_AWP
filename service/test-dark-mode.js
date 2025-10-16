/**
 * Dark Mode Integration Test
 * Verify all HTML files have loader.js integrated
 */

const fs = require('fs');
const path = require('path');

console.log('\n🧪 Testing Dark Mode Integration...\n');

const htmlFiles = [
    'index.html',
    'inventory.html',
    'products.html',
    'orders.html',
    'production.html',
    'warehouse.html',
    'user-management.html',
    'roles.html',
    'suppliers.html',
    'customers.html',
    'reports.html',
    'stock-movement.html',
    'profile.html'
];

let passCount = 0;
let failCount = 0;

htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, 'public', file);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasLoader = content.includes('/js/modules/loader.js');
        
        if (hasLoader) {
            console.log(`✅ ${file.padEnd(30)} - loader.js included`);
            passCount++;
        } else {
            console.log(`❌ ${file.padEnd(30)} - loader.js MISSING!`);
            failCount++;
        }
    } catch (error) {
        console.log(`⚠️  ${file.padEnd(30)} - File not found`);
        failCount++;
    }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${passCount}/${htmlFiles.length}`);
console.log(`   ❌ Failed: ${failCount}/${htmlFiles.length}`);

if (failCount === 0) {
    console.log(`\n🎉 All files have dark mode support!`);
    console.log(`   Ready to test in browser.`);
    console.log(`\n   Next Steps:`);
    console.log(`   1. Refresh browser (Ctrl + F5)`);
    console.log(`   2. Look for theme toggle button in topbar`);
    console.log(`   3. Click to toggle dark mode`);
    console.log(`   4. Test keyboard shortcut: Ctrl + Shift + L`);
} else {
    console.log(`\n⚠️  Some files are missing dark mode integration!`);
    console.log(`   Please check files marked with ❌`);
}

console.log('\n');

// Test if theme-manager.js exists
const themeManagerPath = path.join(__dirname, 'public/js/modules/ui/theme-manager.js');
const darkModeCssPath = path.join(__dirname, 'public/css/modules/themes/dark-mode.css');

console.log('📁 Dark Mode Files:');
console.log(`   ${fs.existsSync(themeManagerPath) ? '✅' : '❌'} theme-manager.js`);
console.log(`   ${fs.existsSync(darkModeCssPath) ? '✅' : '❌'} dark-mode.css`);
console.log('');
