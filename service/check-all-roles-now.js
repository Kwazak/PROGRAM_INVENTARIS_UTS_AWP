const mysql = require('mysql2/promise');

async function checkAllRoles() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Kwazak_290906',
        database: 'factory_inventory'
    });

    console.log('\n=== ALL ROLES IN DATABASE ===\n');

    const [roles] = await connection.execute('SELECT * FROM roles ORDER BY id');
    
    console.log(`Total roles: ${roles.length}\n`);
    
    roles.forEach(role => {
        console.log(`ID: ${role.id} | Name: ${role.name} | System: ${role.is_system} | Active: ${role.is_active}`);
        console.log(`   Description: ${role.description}`);
        console.log('');
    });

    // Check users with their roles
    console.log('\n=== USERS AND THEIR ROLES ===\n');
    
    const [users] = await connection.execute(`
        SELECT 
            u.id,
            u.username,
            u.full_name,
            GROUP_CONCAT(r.name) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
        LEFT JOIN roles r ON ur.role_id = r.id
        GROUP BY u.id, u.username, u.full_name
        ORDER BY u.id
    `);
    
    users.forEach(user => {
        console.log(`${user.username} (${user.full_name}): ${user.roles || 'NO ROLE'}`);
    });

    await connection.end();
}

checkAllRoles().catch(console.error);
