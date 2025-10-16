const db = require('./db');
const bcrypt = require('bcrypt');

(async () => {
    try {
        const [users] = await db.query('SELECT id, username, password FROM users WHERE username=?', ['viewer3']);
        
        if (users.length === 0) {
            console.log('❌ User viewer3 not found!');
            process.exit(1);
        }
        
        const user = users[0];
        console.log('User:', user.username);
        
        const testPassword = 'viewer123';
        const match = await bcrypt.compare(testPassword, user.password);
        
        console.log(`Password test: ${testPassword}`);
        console.log(`Match: ${match ? '✅ CORRECT' : '❌ WRONG'}`);
        
        if (!match) {
            console.log('\n🔧 Resetting password to viewer123...');
            const hashedPassword = await bcrypt.hash(testPassword, 10);
            await db.query('UPDATE users SET password=? WHERE id=?', [hashedPassword, user.id]);
            console.log('✅ Password reset successfully!');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
