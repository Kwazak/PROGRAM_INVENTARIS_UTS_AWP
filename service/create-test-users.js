/**
 * Create Test Users for RBAC Security Testing
 * Creates viewer3 and manager1 users with proper roles
 */

const db = require('./db');
const bcrypt = require('bcrypt');

async function createTestUsers() {
    console.log('🔧 Creating Test Users for RBAC Security Testing...\n');
    
    try {
        // 1. Create Viewer User
        console.log('📝 Creating Viewer user...');
        
        const viewerPassword = await bcrypt.hash('viewer123', 10);
        
        // Check if viewer3 exists
        const [existingViewer] = await db.query(
            'SELECT id FROM users WHERE username = ?',
            ['viewer3']
        );
        
        let viewerUserId;
        
        if (existingViewer.length === 0) {
            const [viewerResult] = await db.query(
                `INSERT INTO users (username, email, password, full_name) 
                 VALUES (?, ?, ?, ?)`,
                ['viewer3', 'viewer3@test.com', viewerPassword, 'Test Viewer User']
            );
            viewerUserId = viewerResult.insertId;
            console.log(`✅ Created viewer3 (ID: ${viewerUserId})`);
        } else {
            viewerUserId = existingViewer[0].id;
            // Update password
            await db.query(
                'UPDATE users SET password = ? WHERE id = ?',
                [viewerPassword, viewerUserId]
            );
            console.log(`✅ Updated viewer3 (ID: ${viewerUserId})`);
        }
        
        // Assign Viewer role
        const [viewerRole] = await db.query(
            'SELECT id FROM roles WHERE name = ?',
            ['Viewer']
        );
        
        if (viewerRole.length > 0) {
            // Delete existing role assignments
            await db.query(
                'DELETE FROM user_roles WHERE user_id = ?',
                [viewerUserId]
            );
            
            // Assign Viewer role
            await db.query(
                'INSERT INTO user_roles (user_id, role_id, is_active) VALUES (?, ?, 1)',
                [viewerUserId, viewerRole[0].id]
            );
            console.log(`   ✅ Assigned Viewer role to viewer3`);
        }
        
        // 2. Create Manager User
        console.log('\n📝 Creating Manager user...');
        
        const managerPassword = await bcrypt.hash('manager123', 10);
        
        // Check if manager1 exists
        const [existingManager] = await db.query(
            'SELECT id FROM users WHERE username = ?',
            ['manager1']
        );
        
        let managerUserId;
        
        if (existingManager.length === 0) {
            const [managerResult] = await db.query(
                `INSERT INTO users (username, email, password, full_name) 
                 VALUES (?, ?, ?, ?)`,
                ['manager1', 'manager1@test.com', managerPassword, 'Test Manager User']
            );
            managerUserId = managerResult.insertId;
            console.log(`✅ Created manager1 (ID: ${managerUserId})`);
        } else {
            managerUserId = existingManager[0].id;
            // Update password
            await db.query(
                'UPDATE users SET password = ? WHERE id = ?',
                [managerPassword, managerUserId]
            );
            console.log(`✅ Updated manager1 (ID: ${managerUserId})`);
        }
        
        // Assign Manager role
        const [managerRole] = await db.query(
            'SELECT id FROM roles WHERE name = ?',
            ['Manager']
        );
        
        if (managerRole.length > 0) {
            // Delete existing role assignments
            await db.query(
                'DELETE FROM user_roles WHERE user_id = ?',
                [managerUserId]
            );
            
            // Assign Manager role
            await db.query(
                'INSERT INTO user_roles (user_id, role_id, is_active) VALUES (?, ?, 1)',
                [managerUserId, managerRole[0].id]
            );
            console.log(`   ✅ Assigned Manager role to manager1`);
        }
        
        // 3. Verify
        console.log('\n📊 Verification:');
        
        const [users] = await db.query(`
            SELECT 
                u.username,
                u.email,
                r.name as role_name,
                COUNT(DISTINCT p.id) as permission_count
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
            LEFT JOIN roles r ON ur.role_id = r.id
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            WHERE u.username IN ('viewer3', 'manager1', 'admin')
            GROUP BY u.id, u.username, u.email, r.name
            ORDER BY u.username
        `);
        
        console.log('\n┌─────────────────────────────────────────────────────────┐');
        console.log('│ Test Users Created                                      │');
        console.log('├─────────────┬───────────────────┬──────────┬────────────┤');
        console.log('│ Username    │ Email             │ Role     │ Perms      │');
        console.log('├─────────────┼───────────────────┼──────────┼────────────┤');
        
        users.forEach(user => {
            console.log(`│ ${user.username.padEnd(11)} │ ${user.email.padEnd(17)} │ ${(user.role_name || 'N/A').padEnd(8)} │ ${String(user.permission_count).padEnd(10)} │`);
        });
        
        console.log('└─────────────┴───────────────────┴──────────┴────────────┘');
        
        console.log('\n✅ Test users created successfully!');
        console.log('\n📝 Test Credentials:');
        console.log('   Viewer:  viewer3 / viewer123');
        console.log('   Manager: manager1 / manager123');
        console.log('   Admin:   admin / admin123');
        
        console.log('\n🧪 You can now run: node test-rbac-security.js');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error creating test users:', error);
        process.exit(1);
    }
}

createTestUsers();
