const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

const USERS = {
    viewer: { username: 'viewer3', password: 'viewer123' },
    manager: { username: 'manager1', password: 'manager123' },
    admin: { username: 'admin', password: 'admin123' }
};

let tokens = {};
let results = { total: 0, passed: 0, failed: 0 };

async function login(role) {
    const r = await axios.post(`${API_BASE}/auth/login`, USERS[role]);
    tokens[role] = r.data.token;
    console.log(`✅ Login ${role}: ${USERS[role].username}`);
    return true;
}

async function req(method, endpoint, role, data = null) {
    try {
        const r = await axios({ method, url: `${API_BASE}${endpoint}`, headers: { Authorization: `Bearer ${tokens[role]}` }, data });
        return { ok: true, status: r.status };
    } catch (e) {
        return { ok: false, status: e.response?.status || 500 };
    }
}

function test(name, pass, msg) {
    results.total++;
    if (pass) results.passed++;
    else results.failed++;
    console.log(`${pass ? '✅' : '❌'} ${name}: ${msg}`);
}

async function testLogin() {
    try {
        console.log('\n' + '='.repeat(60));
        console.log('🔒 RBAC SECURITY TEST - 3 ROLES ONLY');
        console.log('='.repeat(60) + '\n');
        
        await login('viewer');
        await login('manager');
        await login('admin');
        
        console.log('\n--- VIEWER TESTS ---');
        let r = await req('GET', '/dashboard/production', 'viewer');
        test('Viewer dashboard READ', r.ok, r.status);
        
        r = await req('POST', '/products', 'viewer', { name: 'Test', type: 'sendal' });
        test('Viewer product CREATE (should FAIL)', !r.ok && r.status === 403, r.status);
        
        r = await req('GET', '/users', 'viewer');
        test('Viewer users (should FAIL)', !r.ok && r.status === 403, r.status);
        
        console.log('\n--- MANAGER TESTS ---');
        r = await req('GET', '/products', 'manager');
        test('Manager products READ', r.ok, r.status);
        
        r = await req('POST', '/products', 'manager', { 
            name: 'Manager Product', 
            type: 'sendal', 
            sku_code: 'MGR' + Date.now(), 
            category_id: 1, 
            unit_price: 50000, 
            min_stock: 10, 
            current_stock: 100 
        });
        test('Manager product CREATE', r.ok, r.status);
        
        r = await req('GET', '/users', 'manager');
        test('Manager users (should FAIL)', !r.ok && r.status === 403, r.status);
        
        console.log('\n--- ADMIN TESTS ---');
        r = await req('GET', '/users', 'admin');
        test('Admin users READ', r.ok, r.status);
        
        r = await req('GET', '/roles', 'admin');
        test('Admin roles READ', r.ok, r.status);
        
        r = await req('DELETE', '/roles/2', 'admin');
        test('Admin delete system role (should FAIL)', !r.ok && r.status === 403, r.status);
        
        r = await req('PUT', '/roles/2', 'admin', { name: 'Hacked' });
        test('Admin modify system role (should FAIL)', !r.ok && r.status === 403, r.status);
        
        console.log('\n' + '='.repeat(60));
        console.log(`📊 RESULT: ${results.passed}/${results.total} passed (${((results.passed/results.total)*100).toFixed(1)}%)`);
        console.log('='.repeat(60) + '\n');
        
        if (results.passed === results.total) {
            console.log('🎉 PERFECT! All tests passed!\n');
        }
        
        process.exit(results.failed > 0 ? 1 : 0);
        
    } catch (error) {
        console.log('\n❌ TEST ERROR!');
        console.log('Message:', error.message);
        process.exit(1);
    }
}

testLogin();
