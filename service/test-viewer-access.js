const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testViewerAccess() {
    try {
        // Login as viewer
        console.log('Logging in as viewer3...');
        const loginRes = await axios.post(`${API_BASE}/auth/login`, {
            username: 'viewer3',
            password: 'viewer123'
        });
        
        console.log('✅ Login successful');
        const token = loginRes.data.token;
        console.log('Permissions:', loginRes.data.user.permissions);
        
        // Test /users endpoint
        console.log('\n Testing /users endpoint...');
        try {
            const usersRes = await axios.get(`${API_BASE}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('❌ FAIL: Viewer CAN access /users (should be 403)');
            console.log('Status:', usersRes.status);
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('✅ PASS: Viewer CANNOT access /users (403)');
            } else {
                console.log('⚠️  Unexpected error:', error.response?.status, error.message);
            }
        }
        
        // Test /roles endpoint  
        console.log('\nTesting /roles endpoint...');
        try {
            const rolesRes = await axios.get(`${API_BASE}/roles`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('❌ FAIL: Viewer CAN access /roles (should be 403)');
            console.log('Status:', rolesRes.status);
        } catch (error) {
            if (error.response?.status === 403) {
                console.log('✅ PASS: Viewer CANNOT access /roles (403)');
            } else {
                console.log('⚠️  Unexpected error:', error.response?.status, error.message);
            }
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testViewerAccess();
