const http = require('http');

const API_BASE = 'http://localhost:3000/api';

// Helper function to make POST requests
function post(url, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
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
        req.write(postData);
        req.end();
    });
}

async function testAllFixes() {
    console.log('\n' + '='.repeat(60));
    console.log('🔧 TESTING 3 CRITICAL FIXES');
    console.log('='.repeat(60) + '\n');
    
    let passed = 0;
    let failed = 0;
    
    // TEST 1: Admin Login (Issue #1 Fix)
    console.log('📝 TEST 1: Admin Login (Super Admin fix)');
    try {
        const r = await post(`${API_BASE}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        
        if (r.data.success && r.data.user.role === 'Admin') {
            console.log('✅ PASS: Admin login successful');
            console.log(`   Role: ${r.data.user.role}`);
            console.log(`   User: ${r.data.user.username}`);
            passed++;
        } else {
            console.log('❌ FAIL: Admin login issue');
            console.log('   Response:', JSON.stringify(r.data, null, 2));
            failed++;
        }
    } catch (error) {
        console.log('❌ FAIL: Admin login error');
        console.log('   Error:', error.message);
        failed++;
    }
    
    // TEST 2: Manager Login
    console.log('\n📝 TEST 2: Manager Login');
    try {
        const r = await post(`${API_BASE}/auth/login`, {
            username: 'manager1',
            password: 'manager123'
        });
        
        if (r.data.success && r.data.user.role === 'Manager') {
            console.log('✅ PASS: Manager login successful');
            console.log(`   Role: ${r.data.user.role}`);
            passed++;
        } else {
            console.log('❌ FAIL: Manager login issue');
            console.log('   Response:', JSON.stringify(r.data, null, 2));
            failed++;
        }
    } catch (error) {
        console.log('❌ FAIL: Manager login error');
        console.log('   Error:', error.message);
        failed++;
    }
    
    // TEST 3: Viewer Login
    console.log('\n📝 TEST 3: Viewer Login');
    try {
        const r = await post(`${API_BASE}/auth/login`, {
            username: 'viewer3',
            password: 'viewer123'
        });
        
        if (r.data.success && r.data.user.role === 'Viewer') {
            console.log('✅ PASS: Viewer login successful');
            console.log(`   Role: ${r.data.user.role}`);
            passed++;
        } else {
            console.log('❌ FAIL: Viewer login issue');
            console.log('   Response:', JSON.stringify(r.data, null, 2));
            failed++;
        }
    } catch (error) {
        console.log('❌ FAIL: Viewer login error');
        console.log('   Error:', error.message);
        failed++;
    }
    
    // TEST 4: Register New User (Issue #2)
    console.log('\n📝 TEST 4: Register New User');
    try {
        const timestamp = Date.now();
        const r = await post(`${API_BASE}/auth/register`, {
            username: `testuser${timestamp}`,
            email: `test${timestamp}@example.com`,
            password: 'test123456',
            full_name: 'Test User Auto',
            phone: '08123456789'
        });
        
        if (r.data.success) {
            console.log('✅ PASS: User registration successful');
            console.log(`   Message: ${r.data.message}`);
            passed++;
        } else {
            console.log('❌ FAIL: Registration failed');
            console.log('   Response:', JSON.stringify(r.data, null, 2));
            failed++;
        }
    } catch (error) {
        console.log('❌ FAIL: Registration error');
        console.log('   Error:', error.message);
        failed++;
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
        console.log('🎉 ALL FIXES VERIFIED! Ready for production!\n');
    } else {
        console.log('⚠️  Some tests failed. Please review.\n');
    }
    
    process.exit(failed > 0 ? 1 : 0);
}

testAllFixes();
