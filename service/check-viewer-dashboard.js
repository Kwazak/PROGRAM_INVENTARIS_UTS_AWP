const db = require('./db');

(async () => {
    try {
        const [perms] = await db.query(`
            SELECT p.module, p.action, p.resource
            FROM role_permissions rp 
            JOIN permissions p ON rp.permission_id=p.id 
            JOIN roles r ON rp.role_id=r.id 
            WHERE r.name='Viewer' AND p.module='dashboard'
            ORDER BY p.resource
        `);
        
        console.log('Viewer Dashboard Permissions:');
        console.log(JSON.stringify(perms, null, 2));
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
