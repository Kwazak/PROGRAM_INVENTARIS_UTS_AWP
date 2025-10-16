const mysql = require('mysql2/promise');

async function fixAdminPermissions() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Kwazak_290906',
        database: 'factory_inventory'
    });

    console.log('\n=== ADDING MISSING PERMISSIONS TO ADMIN ===\n');

    // Get Admin role ID
    const [adminRole] = await connection.execute(
        'SELECT id FROM roles WHERE name = ?',
        ['Admin']
    );
    const adminRoleId = adminRole[0].id;

    // Check if stock_level permission exists
    const [stockLevelPerm] = await connection.execute(`
        SELECT * FROM permissions 
        WHERE module = 'inventory' 
        AND action = 'read' 
        AND resource = 'stock_level'
    `);

    let stockLevelPermId;
    
    if (stockLevelPerm.length === 0) {
        console.log('Creating permission: inventory:read:stock_level');
        const [result] = await connection.execute(`
            INSERT INTO permissions (module, action, resource, description)
            VALUES ('inventory', 'read', 'stock_level', 'View stock level alerts')
        `);
        stockLevelPermId = result.insertId;
        console.log('✅ Permission created with ID:', stockLevelPermId);
    } else {
        stockLevelPermId = stockLevelPerm[0].id;
        console.log('Permission already exists with ID:', stockLevelPermId);
    }

    // Check if Admin already has this permission
    const [existing] = await connection.execute(`
        SELECT * FROM role_permissions 
        WHERE role_id = ? AND permission_id = ?
    `, [adminRoleId, stockLevelPermId]);

    if (existing.length === 0) {
        // Add permission to Admin
        await connection.execute(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (?, ?)
        `, [adminRoleId, stockLevelPermId]);
        console.log('✅ Added inventory:read:stock_level to Admin role');
    } else {
        console.log('Admin already has this permission');
    }

    // Verify
    const [verify] = await connection.execute(`
        SELECT p.* 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? 
        AND p.module = 'inventory'
        ORDER BY p.action, p.resource
    `, [adminRoleId]);

    console.log('\nAdmin inventory permissions after fix:');
    verify.forEach(p => {
        console.log(`  - ${p.module}:${p.action}:${p.resource || 'all'}`);
    });

    await connection.end();
    console.log('\n✅ DONE! Admin can now access /api/materials/alerts/low-stock\n');
}

fixAdminPermissions().catch(console.error);
