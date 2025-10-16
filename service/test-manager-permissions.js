const axios = require('axios');

async function testManagerLogin() {
    try {
        console.log('🧪 Testing Manager Permissions Format...\n');
        
        // Test 1: Login as manager panasia
        console.log('📝 Test 1: Login as manager1 (manager panasia)');
        const response1 = await axios.post('http://localhost:3000/api/auth/login', {
            username: 'manager1',
            password: 'password123'
        });
        
        console.log('✅ Login successful!');
        console.log('👤 User:', response1.data.user.username);
        console.log('🎭 Role:', response1.data.user.role);
        console.log('📋 Permissions count:', response1.data.user.permissions.length);
        console.log('🔍 First 10 permissions:');
        response1.data.user.permissions.slice(0, 10).forEach((perm, i) => {
            console.log(`   ${i + 1}. ${perm}`);
        });
        
        // Check format
        const hasModule = response1.data.user.permissions[0].split(':').length >= 2;
        console.log('\n📊 Permission format check:', hasModule ? '✅ CORRECT (module:action:resource)' : '❌ WRONG');
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test 2: Login as Manager cikupa
        console.log('📝 Test 2: Login as rina09 (Manager cikupa)');
        const response2 = await axios.post('http://localhost:3000/api/auth/login', {
            username: 'rina09',
            password: 'password123'
        });
        
        console.log('✅ Login successful!');
        console.log('👤 User:', response2.data.user.username);
        console.log('🎭 Role:', response2.data.user.role);
        console.log('📋 Permissions count:', response2.data.user.permissions.length);
        console.log('🔍 First 10 permissions:');
        response2.data.user.permissions.slice(0, 10).forEach((perm, i) => {
            console.log(`   ${i + 1}. ${perm}`);
        });
        
        // Compare permissions
        console.log('\n📊 Permission comparison:');
        console.log(`   manager1 (manager panasia): ${response1.data.user.permissions.length} permissions`);
        console.log(`   rina09 (Manager cikupa): ${response2.data.user.permissions.length} permissions`);
        
        const areSame = JSON.stringify(response1.data.user.permissions.sort()) === 
                       JSON.stringify(response2.data.user.permissions.sort());
        
        console.log(`   Are permissions identical? ${areSame ? '⚠️ YES (might be expected if same permissions assigned)' : '✅ NO (different permissions!)'}`);
        
        console.log('\n✅ All tests completed!');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

testManagerLogin();
