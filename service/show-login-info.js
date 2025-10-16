/**
 * Check Users with Roles
 */

const db = require('./db');

console.log('\n🔍 Checking users with roles...\n');

(async () => {
    try {
        const [results] = await db.query(`
            SELECT 
                u.id,
                u.username,
                u.full_name,
                u.email,
                u.is_active,
                GROUP_CONCAT(r.name) as roles
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            GROUP BY u.id
            ORDER BY u.id
        `);

        if (results.length === 0) {
            console.log('⚠️  No users found in database!\n');
        } else {
            console.log('✅ Found', results.length, 'users:\n');
            console.table(results);
            
            console.log('\n📝 LOGIN CREDENTIALS:');
            console.log('━'.repeat(60));
            
            const adminUser = results.find(u => u.username === 'admin');
            if (adminUser) {
                console.log('\n🔑 ADMIN LOGIN:');
                console.log('   Username: admin');
                console.log('   Password: admin123');
                console.log('   Role:', adminUser.roles || 'No role assigned');
            }
            
            const manager = results.find(u => u.username.includes('manager'));
            if (manager) {
                console.log('\n👔 MANAGER LOGIN:');
                console.log('   Username:', manager.username);
                console.log('   Password: manager123');
                console.log('   Role:', manager.roles || 'No role assigned');
            }
            
            const viewer = results.find(u => u.username.includes('viewer'));
            if (viewer) {
                console.log('\n👁️  VIEWER LOGIN:');
                console.log('   Username:', viewer.username);
                console.log('   Password: viewer123');
                console.log('   Role:', viewer.roles || 'No role assigned');
            }
            
            console.log('\n━'.repeat(60));
            console.log('\n💡 TIP: Jika error 401, gunakan username & password di atas');
            console.log('       Di halaman login sudah tertera: admin / admin123\n');
        }

        await db.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();
