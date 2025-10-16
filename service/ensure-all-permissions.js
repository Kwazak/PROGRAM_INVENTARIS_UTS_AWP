const mysql = require('mysql2/promise');

async function ensureAllPermissions() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Kwazak_290906',
        database: 'factory_inventory'
    });

    console.log('\n=== ENSURING ALL ROLES HAVE CORRECT PERMISSIONS ===\n');

    // Define required permissions that might be missing
    const requiredPermissions = [
        { module: 'inventory', action: 'read', resource: 'stock_level', description: 'View stock level alerts', roles: ['Admin', 'Manager', 'Viewer'] },
        { module: 'dashboard', action: 'read', resource: 'overview', description: 'View dashboard overview', roles: ['Admin', 'Manager', 'Viewer'] },
        { module: 'dashboard', action: 'read', resource: 'analytics', description: 'View dashboard analytics', roles: ['Admin', 'Manager', 'Viewer'] },
        { module: 'dashboard', action: 'read', resource: 'statistics', description: 'View dashboard statistics', roles: ['Admin', 'Manager', 'Viewer'] },
        { module: 'reports', action: 'read', resource: 'inventory_report', description: 'View inventory reports', roles: ['Admin', 'Manager', 'Viewer'] },
        { module: 'reports', action: 'read', resource: 'sales_report', description: 'View sales reports', roles: ['Admin', 'Manager', 'Viewer'] },
        { module: 'reports', action: 'read', resource: 'production_report', description: 'View production reports', roles: ['Admin', 'Manager', 'Viewer'] },
        { module: 'reports', action: 'read', resource: 'financial_report', description: 'View financial reports', roles: ['Admin', 'Manager', 'Viewer'] }
    ];

    // Get all role IDs
    const [roles] = await connection.execute('SELECT id, name FROM roles WHERE name IN (?, ?, ?)', ['Admin', 'Manager', 'Viewer']);
    const roleMap = {};
    roles.forEach(r => roleMap[r.name] = r.id);

    console.log('Roles:', roleMap);

    let added = 0;
    let skipped = 0;

    for (const perm of requiredPermissions) {
        // Check if permission exists
        const [existing] = await connection.execute(`
            SELECT id FROM permissions 
            WHERE module = ? AND action = ? AND resource = ?
        `, [perm.module, perm.action, perm.resource]);

        let permId;
        if (existing.length === 0) {
            // Create permission
            const [result] = await connection.execute(`
                INSERT INTO permissions (module, action, resource, description)
                VALUES (?, ?, ?, ?)
            `, [perm.module, perm.action, perm.resource, perm.description]);
            permId = result.insertId;
            console.log(`✅ Created permission: ${perm.module}:${perm.action}:${perm.resource}`);
        } else {
            permId = existing[0].id;
        }

        // Add to required roles
        for (const roleName of perm.roles) {
            const roleId = roleMap[roleName];
            if (!roleId) continue;

            const [hasIt] = await connection.execute(`
                SELECT * FROM role_permissions 
                WHERE role_id = ? AND permission_id = ?
            `, [roleId, permId]);

            if (hasIt.length === 0) {
                await connection.execute(`
                    INSERT INTO role_permissions (role_id, permission_id)
                    VALUES (?, ?)
                `, [roleId, permId]);
                console.log(`  ✅ Added to ${roleName}`);
                added++;
            } else {
                skipped++;
            }
        }
    }

    console.log(`\n📊 Summary: ${added} permissions added, ${skipped} already existed`);

    // Verify each role
    console.log('\n=== FINAL PERMISSION COUNT ===\n');
    for (const [roleName, roleId] of Object.entries(roleMap)) {
        const [perms] = await connection.execute(`
            SELECT COUNT(*) as count FROM role_permissions WHERE role_id = ?
        `, [roleId]);
        console.log(`${roleName}: ${perms[0].count} permissions`);
    }

    await connection.end();
    console.log('\n✅ DONE!\n');
}

ensureAllPermissions().catch(console.error);
