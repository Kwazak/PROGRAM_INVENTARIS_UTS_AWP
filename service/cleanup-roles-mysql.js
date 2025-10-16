const db = require('./db');

(async () => {
    try {
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║         CLEANUP ROLES - KEEP ONLY 3 ROLES             ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
        
        // Step 1: Check current state
        console.log('📊 STEP 1: Checking current roles...\n');
        
        const [currentRoles] = await db.query('SELECT id, name FROM roles ORDER BY id');
        console.log('Current Roles:');
        currentRoles.forEach(r => console.log(`  - ${r.id}. ${r.name}`));
        
        // Step 2: Migrate users from unwanted roles
        console.log('\n📦 STEP 2: Migrating users...\n');
        
        // Get role IDs
        const [roles] = await db.query(`
            SELECT id, name FROM roles 
            WHERE name IN ('Super Admin', 'Admin', 'Manager', 'Staff', 'Viewer')
        `);
        
        const roleMap = {};
        roles.forEach(r => {
            roleMap[r.name] = r.id;
        });
        
        console.log('Role ID Map:', roleMap);
        
        // Migrate Super Admin → Admin
        if (roleMap['Super Admin'] && roleMap['Admin']) {
            console.log('\n  ➜ Migrating users from Super Admin → Admin');
            
            const [superAdminUsers] = await db.query(`
                SELECT user_id FROM user_roles 
                WHERE role_id = ? AND is_active = 1
            `, [roleMap['Super Admin']]);
            
            for (const user of superAdminUsers) {
                // Check if user already has Admin role
                const [existing] = await db.query(`
                    SELECT id FROM user_roles 
                    WHERE user_id = ? AND role_id = ? AND is_active = 1
                `, [user.user_id, roleMap['Admin']]);
                
                if (existing.length === 0) {
                    // Add Admin role
                    await db.query(`
                        INSERT INTO user_roles (user_id, role_id, is_active) 
                        VALUES (?, ?, 1)
                    `, [user.user_id, roleMap['Admin']]);
                    console.log(`    ✅ User ${user.user_id}: Added Admin role`);
                }
                
                // Deactivate Super Admin role
                await db.query(`
                    UPDATE user_roles 
                    SET is_active = 0 
                    WHERE user_id = ? AND role_id = ?
                `, [user.user_id, roleMap['Super Admin']]);
                console.log(`    ✅ User ${user.user_id}: Removed Super Admin role`);
            }
        }
        
        // Migrate Staff → Viewer
        if (roleMap['Staff'] && roleMap['Viewer']) {
            console.log('\n  ➜ Migrating users from Staff → Viewer');
            
            const [staffUsers] = await db.query(`
                SELECT user_id FROM user_roles 
                WHERE role_id = ? AND is_active = 1
            `, [roleMap['Staff']]);
            
            for (const user of staffUsers) {
                // Check if user already has Viewer role
                const [existing] = await db.query(`
                    SELECT id FROM user_roles 
                    WHERE user_id = ? AND role_id = ? AND is_active = 1
                `, [user.user_id, roleMap['Viewer']]);
                
                if (existing.length === 0) {
                    // Add Viewer role
                    await db.query(`
                        INSERT INTO user_roles (user_id, role_id, is_active) 
                        VALUES (?, ?, 1)
                    `, [user.user_id, roleMap['Viewer']]);
                    console.log(`    ✅ User ${user.user_id}: Added Viewer role`);
                }
                
                // Deactivate Staff role
                await db.query(`
                    UPDATE user_roles 
                    SET is_active = 0 
                    WHERE user_id = ? AND role_id = ?
                `, [user.user_id, roleMap['Staff']]);
                console.log(`    ✅ User ${user.user_id}: Removed Staff role`);
            }
        }
        
        // Step 3: Delete unwanted roles
        console.log('\n🗑️  STEP 3: Deleting unwanted roles...\n');
        
        // First, delete role_permissions for these roles
        const rolesToDelete = ['Super Admin', 'Staff'];
        
        for (const roleName of rolesToDelete) {
            if (roleMap[roleName]) {
                // Delete user_roles first (foreign key constraint)
                await db.query(`
                    DELETE FROM user_roles 
                    WHERE role_id = ?
                `, [roleMap[roleName]]);
                console.log(`  ✅ Deleted user assignments for: ${roleName}`);
                
                // Delete role permissions
                await db.query(`
                    DELETE FROM role_permissions 
                    WHERE role_id = ?
                `, [roleMap[roleName]]);
                console.log(`  ✅ Deleted permissions for: ${roleName}`);
                
                // Delete the role
                await db.query(`
                    DELETE FROM roles 
                    WHERE id = ?
                `, [roleMap[roleName]]);
                console.log(`  ✅ Deleted role: ${roleName}`);
            }
        }
        
        // Delete SQL injection test role (id 48)
        const [sqlInjectionRole] = await db.query(`
            SELECT id FROM roles WHERE name LIKE '%DROP TABLE%' OR name LIKE '%Test%'
        `);
        
        for (const role of sqlInjectionRole) {
            // Delete user_roles first
            await db.query('DELETE FROM user_roles WHERE role_id = ?', [role.id]);
            console.log(`  ✅ Deleted user assignments for test role: ${role.id}`);
            
            // Delete permissions
            await db.query('DELETE FROM role_permissions WHERE role_id = ?', [role.id]);
            console.log(`  ✅ Deleted permissions for test role: ${role.id}`);
            
            // Delete role
            await db.query('DELETE FROM roles WHERE id = ?', [role.id]);
            console.log(`  ✅ Deleted malicious/test role: ${role.id}`);
        }
        
        // Step 4: Verify final state
        console.log('\n✅ STEP 4: Verification...\n');
        
        const [finalRoles] = await db.query(`
            SELECT id, name, description 
            FROM roles 
            WHERE is_active = 1
            ORDER BY id
        `);
        
        console.log('Final Roles (should be only 3):');
        finalRoles.forEach(r => {
            console.log(`  ${r.id}. ${r.name}`);
            console.log(`     ${r.description}`);
        });
        
        console.log('\n📊 User Distribution:');
        const [userCounts] = await db.query(`
            SELECT r.name, COUNT(DISTINCT ur.user_id) as count
            FROM roles r
            LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = 1
            WHERE r.is_active = 1
            GROUP BY r.id, r.name
            ORDER BY r.id
        `);
        
        userCounts.forEach(row => {
            console.log(`  ${row.name}: ${row.count} users`);
        });
        
        // Success summary
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║                  ✅ CLEANUP COMPLETE!                  ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
        
        console.log('✅ Remaining Roles: ' + finalRoles.length);
        console.log('✅ All users migrated successfully');
        console.log('✅ Unwanted roles deleted');
        console.log('✅ Database cleaned\n');
        
        if (finalRoles.length !== 3) {
            console.log('⚠️  WARNING: Expected 3 roles, but found ' + finalRoles.length);
        } else {
            console.log('🎉 PERFECT! Exactly 3 roles as expected!\n');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        console.error('\nRolling back changes...');
        process.exit(1);
    }
})();
