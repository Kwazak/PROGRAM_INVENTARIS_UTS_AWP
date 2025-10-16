const mysql = require('mysql2/promise');

async function checkManagerPermissions() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Kwazak_290906',
        database: 'factory_inventory'
    });

    console.log('\n=== CHECKING MANAGER PERMISSIONS ===\n');

    // Get Manager role
    const [managerRole] = await connection.execute(
        'SELECT * FROM roles WHERE name = ?',
        ['Manager']
    );
    
    if (managerRole.length === 0) {
        console.log('❌ Manager role not found!');
        await connection.end();
        return;
    }
    
    console.log('Manager Role:', managerRole[0]);

    // Get Manager permissions
    const [managerPerms] = await connection.execute(`
        SELECT p.* 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
        ORDER BY p.module, p.action
    `, [managerRole[0].id]);

    console.log(`\nManager has ${managerPerms.length} permissions:`);
    
    // Group by module
    const byModule = {};
    managerPerms.forEach(p => {
        const key = p.module || 'general';
        if (!byModule[key]) byModule[key] = [];
        byModule[key].push(`${p.action}:${p.resource || 'all'}`);
    });

    Object.keys(byModule).sort().forEach(module => {
        console.log(`\n${module}:`);
        byModule[module].forEach(perm => console.log(`  - ${perm}`));
    });

    // Check specific permissions needed for dashboard
    console.log('\n=== CHECKING DASHBOARD PERMISSIONS ===');
    const dashboardPerms = managerPerms.filter(p => p.module === 'dashboard');
    console.log(`Dashboard permissions: ${dashboardPerms.length}`);
    dashboardPerms.forEach(p => {
        console.log(`  - ${p.module}:${p.action}:${p.resource || 'all'}`);
    });

    // Check if Manager has overview permission
    const hasOverview = managerPerms.some(p => 
        p.module === 'dashboard' && p.action === 'read' && p.resource === 'overview'
    );
    console.log(`\nHas dashboard:read:overview? ${hasOverview ? '✅ YES' : '❌ NO'}`);

    await connection.end();
}

checkManagerPermissions().catch(console.error);
