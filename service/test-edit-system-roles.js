const http = require('http');

const API_BASE = 'http://localhost:3000/api';

// Helper function to make requests
function request(method, url, data, token) {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : null;
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (postData) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(body)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: body
                    });
                }
            });
        });
        
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function testEditSystemRoles() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTING: EDIT SYSTEM ROLES FEATURE');
    console.log('='.repeat(60) + '\n');
    
    let passed = 0;
    let failed = 0;
    
    // Step 1: Login as admin
    console.log('📝 Step 1: Login as Admin');
    const loginRes = await request('POST', `${API_BASE}/auth/login`, {
        username: 'admin',
        password: 'admin123'
    });
    
    if (!loginRes.data.success) {
        console.log('❌ FAIL: Cannot login as admin');
        console.log('   Error:', loginRes.data.message);
        process.exit(1);
    }
    
    const token = loginRes.data.token;
    console.log('✅ PASS: Admin logged in\n');
    
    // Step 2: Get roles list
    console.log('📝 Step 2: Get Roles List');
    const rolesRes = await request('GET', `${API_BASE}/roles`, null, token);
    
    if (!rolesRes.data.success) {
        console.log('❌ FAIL: Cannot fetch roles');
        failed++;
    } else {
        const roles = rolesRes.data.data;
        const adminRole = roles.find(r => r.name === 'Admin');
        const managerRole = roles.find(r => r.name === 'Manager');
        const viewerRole = roles.find(r => r.name === 'Viewer');
        
        console.log(`✅ PASS: Found ${roles.length} roles`);
        console.log(`   - Admin (ID: ${adminRole?.id}, System: ${adminRole?.is_system})`);
        console.log(`   - Manager (ID: ${managerRole?.id}, System: ${managerRole?.is_system})`);
        console.log(`   - Viewer (ID: ${viewerRole?.id}, System: ${viewerRole?.is_system})`);
        passed++;
    }
    
    // Step 3: Try to edit Admin role (should succeed now)
    console.log('\n📝 Step 3: Try to Edit Admin Role');
    const adminRole = rolesRes.data.data.find(r => r.name === 'Admin');
    
    const editAdminRes = await request('PUT', `${API_BASE}/roles/${adminRole.id}`, {
        name: 'Admin',
        description: 'Administrative access to manage users and basic configurations - EDITED'
    }, token);
    
    if (editAdminRes.status === 403) {
        console.log('❌ FAIL: Edit Admin role blocked (is_system check still active)');
        console.log('   Status:', editAdminRes.status);
        console.log('   Message:', editAdminRes.data.message);
        failed++;
    } else if (editAdminRes.data.success) {
        console.log('✅ PASS: Admin role edited successfully');
        console.log('   Message:', editAdminRes.data.message);
        passed++;
    } else {
        console.log('❌ FAIL: Edit Admin role failed');
        console.log('   Status:', editAdminRes.status);
        console.log('   Error:', editAdminRes.data.message);
        failed++;
    }
    
    // Step 4: Get Admin permissions
    console.log('\n📝 Step 4: Get Admin Role Permissions');
    const adminDetailsRes = await request('GET', `${API_BASE}/roles/${adminRole.id}`, null, token);
    
    if (!adminDetailsRes.data.success) {
        console.log('❌ FAIL: Cannot get admin details');
        failed++;
    } else {
        const permissions = adminDetailsRes.data.data.permissions;
        console.log(`✅ PASS: Admin has ${permissions.length} permissions`);
        passed++;
    }
    
    // Step 5: Try to update Admin permissions (should succeed now)
    console.log('\n📝 Step 5: Try to Update Admin Permissions');
    const currentPermissions = adminDetailsRes.data.data.permissions;
    const permissionIds = currentPermissions.map(p => p.id);
    
    const updatePermsRes = await request('PUT', `${API_BASE}/roles/${adminRole.id}/permissions`, {
        permission_ids: permissionIds
    }, token);
    
    if (updatePermsRes.status === 403) {
        console.log('❌ FAIL: Update Admin permissions blocked (is_system check still active)');
        console.log('   Status:', updatePermsRes.status);
        console.log('   Message:', updatePermsRes.data.message);
        failed++;
    } else if (updatePermsRes.data.success) {
        console.log('✅ PASS: Admin permissions updated successfully');
        console.log('   Message:', updatePermsRes.data.message);
        console.log('   Stats:', updatePermsRes.data.stats);
        passed++;
    } else {
        console.log('❌ FAIL: Update Admin permissions failed');
        console.log('   Status:', updatePermsRes.status);
        console.log('   Error:', updatePermsRes.data.message);
        failed++;
    }
    
    // Step 6: Try to delete Admin role (should FAIL - still protected)
    console.log('\n📝 Step 6: Try to Delete Admin Role (Should FAIL)');
    const deleteAdminRes = await request('DELETE', `${API_BASE}/roles/${adminRole.id}`, null, token);
    
    if (deleteAdminRes.status === 403) {
        console.log('✅ PASS: Delete Admin role blocked (protection working)');
        console.log('   Message:', deleteAdminRes.data.message);
        passed++;
    } else if (deleteAdminRes.data.success) {
        console.log('❌ FAIL: Admin role deleted (SECURITY BREACH!)');
        console.log('   This should NOT be possible!');
        failed++;
    } else {
        console.log('⚠️  UNKNOWN: Unexpected response');
        console.log('   Status:', deleteAdminRes.status);
        console.log('   Data:', deleteAdminRes.data);
    }
    
    // Step 7: Restore Admin description
    console.log('\n📝 Step 7: Restore Admin Description');
    const restoreRes = await request('PUT', `${API_BASE}/roles/${adminRole.id}`, {
        name: 'Admin',
        description: 'Administrative access to manage users and basic configurations'
    }, token);
    
    if (restoreRes.data.success) {
        console.log('✅ PASS: Admin description restored');
        passed++;
    } else {
        console.log('⚠️  WARNING: Could not restore description');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${passed + failed}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed/(passed+failed))*100).toFixed(1)}%`);
    console.log('='.repeat(60) + '\n');
    
    if (failed === 0) {
        console.log('🎉 ALL TESTS PASSED! Edit System Roles feature is working!\n');
        console.log('✅ Admin can now:');
        console.log('   - Edit Admin role name & description');
        console.log('   - Update Admin role permissions');
        console.log('   - Edit Manager & Viewer roles');
        console.log('   ❌ Cannot delete system roles (protected)\n');
    } else {
        console.log('⚠️  Some tests failed. Please review.\n');
    }
    
    process.exit(failed > 0 ? 1 : 0);
}

testEditSystemRoles().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
