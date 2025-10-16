const db = require('./db');

(async () => {
    try {
        console.log('=== VIEWER PERMISSION AUDIT ===\n');
        
        // Get viewer user_roles
        const [userRoles] = await db.query(`
            SELECT ur.*, r.name as role_name
            FROM user_roles ur
            JOIN roles r ON ur.role_id=r.id
            WHERE ur.user_id=8
        `);
        
        console.log('Viewer3 User Roles:');
        console.log(JSON.stringify(userRoles, null, 2));
        
        // Get all permissions for viewer through all their roles
        const [allPerms] = await db.query(`
            SELECT DISTINCT p.module, p.action, p.resource, r.name as role_name
            FROM user_roles ur
            JOIN role_permissions rp ON ur.role_id=rp.role_id
            JOIN permissions p ON rp.permission_id=p.id
            JOIN roles r ON ur.role_id=r.id
            WHERE ur.user_id=8 AND ur.is_active=1
            ORDER BY p.module, p.resource, p.action
        `);
        
        console.log(`\nViewer3 Total Permissions: ${allPerms.length}`);
        
        // Filter users and roles permissions
        const usersPerms = allPerms.filter(p => p.module === 'users');
        const rolesPerms = allPerms.filter(p => p.module === 'roles');
        
        if (usersPerms.length > 0) {
            console.log('\n⚠️  USERS Module Permissions (should be NONE):');
            console.log(JSON.stringify(usersPerms, null, 2));
        } else {
            console.log('\n✅ No USERS permissions (correct)');
        }
        
        if (rolesPerms.length > 0) {
            console.log('\n⚠️  ROLES Module Permissions (should be NONE):');
            console.log(JSON.stringify(rolesPerms, null, 2));
        } else {
            console.log('\n✅ No ROLES permissions (correct)');
        }
        
        // Group by module
        const byModule = {};
        allPerms.forEach(p => {
            if (!byModule[p.module]) byModule[p.module] = [];
            byModule[p.module].push(`${p.action}.${p.resource}`);
        });
        
        console.log('\n=== PERMISSIONS BY MODULE ===');
        Object.keys(byModule).sort().forEach(module => {
            console.log(`${module}: ${byModule[module].length} permissions`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
