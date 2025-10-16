const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testLogin() {
    try {
        console.log('Testing viewer3 login...');
        console.log('URL:', `${API_BASE}/auth/login`);
        console.log('Data:', { username: 'viewer3', password: 'viewer123' });
        
        const response = await axios.post(`${API_BASE}/auth/login`, {
            username: 'viewer3',
            password: 'viewer123'
        });
        
        console.log('\n✅ LOGIN SUCCESS!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('\n❌ LOGIN FAILED!');
        console.log('Status:', error.response?.status);
        console.log('Data:', error.response?.data);
        console.log('Message:', error.message);
    }
}

testLogin();
