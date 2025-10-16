const db = require('./db');

(async () => {
    try {
        console.log('Checking Viewer permissions for users and roles modules...\n');
        
        const [perms] = await db.query(`
            SELECT p.module, p.action, p.resource
            FROM role_permissions rp 
            JOIN permissions p ON rp.permission_id=p.id 
            JOIN roles r ON rp.role_id=r.id 
            WHERE r.name='Viewer' AND (p.module='users' OR p.module='roles')
            ORDER BY p.module, p.resource
        `);
        
        console.log('Viewer Users/Roles Permissions:');
        console.log(JSON.stringify(perms, null, 2));
        
        if (perms.length > 0) {
            console.log('\n⚠️  Viewer should NOT have users/roles permissions!');
            console.log('\n🔧 Removing these permissions...');
            
            for (const perm of perms) {
                const [permIds] = await db.query(
                    'SELECT id FROM permissions WHERE module=? AND action=? AND resource=?',
                    [perm.module, perm.action, perm.resource]
                );
                
                if (permIds.length > 0) {
                    await db.query(`
                        DELETE FROM role_permissions 
                        WHERE role_id=(SELECT id FROM roles WHERE name='Viewer') 
                        AND permission_id=?
                    `, [permIds[0].id]);
                    
                    console.log(`  ✅ Removed: ${perm.module}.${perm.action}.${perm.resource}`);
                }
            }
            
            console.log('\n✅ All users/roles permissions removed from Viewer!');
        } else {
            console.log('\n✅ Viewer has no users/roles permissions (correct!)');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
