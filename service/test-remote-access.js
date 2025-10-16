const http = require('http');

// Test akses ke server via IP address (simulate remote device)
const IP = '10.70.253.122';
const PORT = 3000;

console.log('='.repeat(60));
console.log('TESTING REMOTE ACCESS');
console.log('='.repeat(60));
console.log(`Target: http://${IP}:${PORT}`);
console.log('Testing...\n');

// Test 1: Homepage
console.log('Test 1: GET / (Homepage)');
const req1 = http.get(`http://${IP}:${PORT}/`, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('✅ Homepage accessible!\n');
        } else {
            console.log('❌ Failed:', res.statusCode, '\n');
        }
        
        // Test 2: API Login endpoint
        console.log('Test 2: POST /api/auth/login');
        const postData = JSON.stringify({
            username: 'admin',
            password: 'password123'
        });
        
        const options = {
            hostname: IP,
            port: PORT,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length,
                'Origin': `http://${IP}:${PORT}` // Simulate browser request
            }
        };
        
        const req2 = http.request(options, (res) => {
            console.log(`Status: ${res.statusCode}`);
            console.log(`Headers:`, res.headers);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('Response:', data);
                if (res.statusCode === 200) {
                    console.log('✅ Login API accessible!');
                } else {
                    console.log('❌ Login failed:', res.statusCode);
                }
                
                console.log('\n' + '='.repeat(60));
                console.log('TESTING COMPLETED');
                console.log('='.repeat(60));
            });
        });
        
        req2.on('error', (err) => {
            console.log('❌ Error:', err.message);
            console.log('\nPossible issues:');
            console.log('1. Server not running');
            console.log('2. Firewall blocking port 3000');
            console.log('3. Not connected to same WiFi');
            console.log('4. IP address changed');
        });
        
        req2.write(postData);
        req2.end();
    });
});

req1.on('error', (err) => {
    console.log('❌ Error:', err.message);
    console.log('\nPossible issues:');
    console.log('1. Server not running');
    console.log('2. Firewall blocking port 3000');
    console.log('3. Wrong IP address');
    console.log('4. Server not listening on 0.0.0.0');
    
    console.log('\nDebugging steps:');
    console.log('1. Check server is running: npm start');
    console.log('2. Check firewall: .\\setup-firewall.ps1');
    console.log('3. Check IP: node get-network-ip.js');
    console.log('4. Check port listening: netstat -an | findstr :3000');
});
