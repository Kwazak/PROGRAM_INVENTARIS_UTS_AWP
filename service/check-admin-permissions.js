const mysql = require('mysql2/promise');

async function checkAdminPermissions() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Kwazak_290906',
        database: 'factory_inventory'
    });

    console.log('\n=== CHECKING ADMIN PERMISSIONS ===\n');

    // Get Admin role
    const [adminRole] = await connection.execute(
        'SELECT * FROM roles WHERE name = ?',
        ['Admin']
    );
    console.log('Admin Role:', adminRole[0]);

    // Get Admin permissions
    const [adminPerms] = await connection.execute(`
        SELECT p.* 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
        ORDER BY p.module, p.action
    `, [adminRole[0].id]);

    console.log(`\nAdmin has ${adminPerms.length} permissions:`);
    
    // Group by module
    const byModule = {};
    adminPerms.forEach(p => {
        const key = p.module || 'general';
        if (!byModule[key]) byModule[key] = [];
        byModule[key].push(`${p.action}:${p.resource || 'all'}`);
    });

    Object.keys(byModule).sort().forEach(module => {
        console.log(`\n${module}:`);
        byModule[module].forEach(perm => console.log(`  - ${perm}`));
    });

    // Check specific permission that's failing
    console.log('\n=== CHECKING SPECIFIC PERMISSION ===');
    const [specificPerm] = await connection.execute(`
        SELECT p.* 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? 
        AND p.module = ? 
        AND p.action = ?
        AND (p.resource = ? OR p.resource IS NULL)
    `, [adminRole[0].id, 'materials', 'read', 'alerts']);

    console.log('\nPermission for materials:read:alerts:', specificPerm);

    // Check all materials permissions
    const [materialPerms] = await connection.execute(`
        SELECT p.* 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? 
        AND p.module = ?
    `, [adminRole[0].id, 'materials']);

    console.log('\nAll materials permissions:');
    materialPerms.forEach(p => {
        console.log(`  - ${p.module}:${p.action}:${p.resource || 'all'}`);
    });

    await connection.end();
}

checkAdminPermissions().catch(console.error);
