const db = require('./db');

(async () => {
    const [users] = await db.query('SELECT id, username, is_active FROM users WHERE username="viewer3"');
    console.log('Viewer3 status:', users);
    process.exit(0);
})();
