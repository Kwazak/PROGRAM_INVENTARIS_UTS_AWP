/**
 * Add Dashboard Permission to Viewer Role
 */

const db = require('./db');

async function addDashboardToViewer() {
    console.log('🔧 Adding Dashboard Permissions to Viewer...\n');
    
    try {
        // Get Viewer role ID
        const [viewerRole] = await db.query(
            'SELECT id FROM roles WHERE name = ?',
            ['Viewer']
        );
        
        if (viewerRole.length === 0) {
            console.log('❌ Viewer role not found');
            process.exit(1);
        }
        
        const viewerRoleId = viewerRole[0].id;
        
        // Get all dashboard read permissions
        const [dashboardPerms] = await db.query(`
            SELECT id, module, action, resource, description
            FROM permissions
            WHERE module = 'dashboard' AND action = 'read'
        `);
        
        console.log(`📋 Found ${dashboardPerms.length} dashboard permissions\n`);
        
        let added = 0;
        
        for (const perm of dashboardPerms) {
            // Check if already assigned
            const [existing] = await db.query(
                'SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
                [viewerRoleId, perm.id]
            );
            
            if (existing.length === 0) {
                await db.query(
                    'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
                    [viewerRoleId, perm.id]
                );
                console.log(`✅ Added: ${perm.module}.${perm.action}.${perm.resource || 'N/A'}`);
                added++;
            } else {
                console.log(`⏭️  Exists: ${perm.module}.${perm.action}.${perm.resource || 'N/A'}`);
            }
        }
        
        console.log(`\n✅ Added ${added} dashboard permissions to Viewer role`);
        
        // Verify
        const [verify] = await db.query(`
            SELECT COUNT(*) as count
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = ? AND p.module = 'dashboard'
        `, [viewerRoleId]);
        
        console.log(`\n📊 Viewer now has ${verify[0].count} dashboard permissions`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addDashboardToViewer();
