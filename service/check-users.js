/**
 * Check Users in Database
 */

const db = require('./db');

console.log('\n🔍 Checking users in database...\n');

(async () => {
    try {
        const [results] = await db.query('SELECT * FROM users ORDER BY id LIMIT 10');

        if (results.length === 0) {
            console.log('⚠️  No users found in database!\n');
            console.log('Run this to create default admin:');
            console.log('  node create-test-users.js\n');
        } else {
            console.log('✅ Found', results.length, 'users:\n');
            console.table(results);
            
            console.log('\n📝 Login Credentials:');
            console.log('━'.repeat(50));
            results.forEach(user => {
                console.log(`\n  Username: ${user.username}`);
                console.log(`  Role: ${user.role}`);
                console.log(`  Status: ${user.status}`);
                if (user.username === 'admin') {
                    console.log(`  Password: admin123`);
                } else if (user.username === 'manager') {
                    console.log(`  Password: manager123`);
                } else if (user.username.startsWith('viewer')) {
                    console.log(`  Password: viewer123`);
                }
            });
            console.log('\n' + '━'.repeat(50));
        }

        await db.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();
