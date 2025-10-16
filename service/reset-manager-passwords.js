require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function resetManagerPasswords() {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('🔐 Resetting passwords for manager accounts...\n');

        // Reset manager1
        await db.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, 'manager1']);
        console.log('✅ manager1 password reset to: password123');

        // Reset rina09
        await db.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, 'rina09']);
        console.log('✅ rina09 password reset to: password123');

        // Reset admin (untuk testing juga)
        await db.query('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, 'admin']);
        console.log('✅ admin password reset to: password123');

        console.log('\n✅ All passwords reset successfully!');
        console.log('\nYou can now login with:');
        console.log('  - admin / password123 (Admin)');
        console.log('  - manager1 / password123 (manager panasia)');
        console.log('  - rina09 / password123 (Manager cikupa)');

        await db.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

resetManagerPasswords();
