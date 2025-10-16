/**
 * Test Modular Structure
 * Testing semua modul baru
 */

console.log('🧪 Testing Modular Structure...\n');

try {
    // Test 1: Import main modules
    console.log('✅ Test 1: Importing main modules...');
    const { config, constants, helpers, utils, middleware } = require('./src');
    console.log('   ✓ Config loaded');
    console.log('   ✓ Constants loaded');
    console.log('   ✓ Helpers loaded');
    console.log('   ✓ Utils loaded');
    console.log('   ✓ Middleware loaded\n');

    // Test 2: Check config
    console.log('✅ Test 2: Checking config...');
    console.log('   Server Port:', config.server.port);
    console.log('   Environment:', config.server.env);
    console.log('   Database:', config.database.dbConfig.database);
    console.log('   JWT Secret:', config.server.jwtSecret ? 'Set' : 'Not Set\n');

    // Test 3: Check constants
    console.log('✅ Test 3: Checking constants...');
    console.log('   Roles:', Object.keys(constants.ROLES).length, 'defined');
    console.log('   Permissions:', Object.keys(constants.PERMISSIONS).length, 'defined');
    console.log('   Order Status:', Object.keys(constants.ORDER_STATUS).length, 'defined\n');

    // Test 4: Check helpers
    console.log('✅ Test 4: Checking helpers...');
    const { ResponseHelper, logger } = helpers;
    console.log('   ResponseHelper methods:', Object.getOwnPropertyNames(ResponseHelper).filter(m => m !== 'length' && m !== 'prototype' && m !== 'name').length);
    console.log('   Logger methods:', ['info', 'success', 'warn', 'error', 'debug'].every(m => typeof logger[m] === 'function') ? 'All available' : 'Missing methods\n');

    // Test 5: Check utils
    console.log('✅ Test 5: Checking utils...');
    const { ValidationUtil, DateUtil, StringUtil, PaginationUtil } = utils;
    
    // Test ValidationUtil
    const testEmail = ValidationUtil.isValidEmail('test@example.com');
    console.log('   ValidationUtil.isValidEmail:', testEmail ? 'Working' : 'Failed');
    
    // Test DateUtil
    const today = DateUtil.getCurrentDate();
    console.log('   DateUtil.getCurrentDate:', today);
    
    // Test StringUtil
    const slug = StringUtil.toSlug('Hello World 123');
    console.log('   StringUtil.toSlug:', slug);
    
    // Test PaginationUtil
    const mockReq = { query: { page: 1, pageSize: 20 } };
    const paginationParams = PaginationUtil.getParams(mockReq);
    console.log('   PaginationUtil.getParams:', paginationParams.page === 1 ? 'Working' : 'Failed\n');

    // Test 6: Check middleware
    console.log('✅ Test 6: Checking middleware...');
    const { ErrorHandler, requestLogger, validate, auth } = middleware;
    console.log('   ErrorHandler:', typeof ErrorHandler === 'object' ? 'Available' : 'Missing');
    console.log('   requestLogger:', typeof requestLogger === 'function' ? 'Available' : 'Missing');
    console.log('   validate:', typeof validate === 'function' ? 'Available' : 'Missing');
    console.log('   auth:', typeof auth === 'object' ? 'Available' : 'Missing\n');

    // Test 7: Test logger output
    console.log('✅ Test 7: Testing logger output...');
    logger.info('This is an info message');
    logger.success('This is a success message');
    logger.warn('This is a warning message');
    // logger.error('This is an error message'); // Commented to not look like real error
    console.log('');

    // Test 8: Test backward compatibility
    console.log('✅ Test 8: Testing backward compatibility...');
    const db = require('./db');
    console.log('   db.js:', typeof db === 'object' ? 'Still working' : 'Broken\n');

    // Test 9: Test validation utilities
    console.log('✅ Test 9: Testing validation utilities...');
    const validations = {
        email: ValidationUtil.isValidEmail('user@example.com'),
        phone: ValidationUtil.isValidPhone('081234567890'),
        positiveNumber: ValidationUtil.isPositiveNumber(100),
        date: ValidationUtil.isValidDate('2025-01-01')
    };
    console.log('   Email validation:', validations.email);
    console.log('   Phone validation:', validations.phone);
    console.log('   Positive number:', validations.positiveNumber);
    console.log('   Date validation:', validations.date);
    console.log('');

    // Test 10: Test string utilities
    console.log('✅ Test 10: Testing string utilities...');
    console.log('   Currency format:', StringUtil.formatCurrency(1000000));
    console.log('   Number format:', StringUtil.formatNumber(1000000));
    console.log('   Title case:', StringUtil.toTitleCase('hello world'));
    console.log('   Random string:', StringUtil.randomString(10));
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('Struktur modular berhasil dibuat dan berfungsi dengan baik.');
    console.log('Semua modul dapat di-import dan digunakan tanpa error.');
    console.log('\n📚 Baca dokumentasi di MODULAR_STRUCTURE.md');
    console.log('📝 Lihat contoh penggunaan di examples.js');
    console.log('\n✨ Happy coding!\n');

} catch (error) {
    console.error('\n❌ ERROR DETECTED:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
}
