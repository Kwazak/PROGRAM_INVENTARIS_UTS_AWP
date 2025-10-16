const db = require('./db');

(async () => {
    try {
        console.log('\n=== CURRENT ROLES IN DATABASE ===\n');
        
        const [roles] = await db.query(`
            SELECT id, name, description, is_system, is_active 
            FROM roles 
            ORDER BY id
        `);
        
        console.log('Total Roles:', roles.length);
        console.log('\nRole List:');
        roles.forEach(role => {
            console.log(`  ${role.id}. ${role.name}`);
            console.log(`     Description: ${role.description || 'N/A'}`);
            console.log(`     System Role: ${role.is_system ? 'Yes' : 'No'}`);
            console.log(`     Active: ${role.is_active ? 'Yes' : 'No'}`);
            console.log('');
        });
        
        console.log('\n=== USERS PER ROLE ===\n');
        
        const [userCounts] = await db.query(`
            SELECT r.name as role_name, COUNT(DISTINCT ur.user_id) as user_count
            FROM roles r
            LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = 1
            GROUP BY r.id, r.name
            ORDER BY r.id
        `);
        
        userCounts.forEach(row => {
            console.log(`  ${row.role_name}: ${row.user_count} users`);
        });
        
        console.log('\n=== USERS WITH THEIR ROLES ===\n');
        
        const [users] = await db.query(`
            SELECT u.id, u.username, u.full_name, r.name as role_name
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE u.is_active = 1
            ORDER BY u.id
        `);
        
        users.forEach(user => {
            console.log(`  ${user.id}. ${user.username} (${user.full_name})`);
            console.log(`     Role: ${user.role_name || 'No role assigned'}`);
            console.log('');
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
