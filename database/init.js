const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initDatabase() {
    try {
        // Create connection using MYSQL_URL or config
        let connection;
        
        if (process.env.MYSQL_URL) {
            connection = await mysql.createConnection(process.env.MYSQL_URL);
        } else {
            connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                port: process.env.DB_PORT || 3306
            });
        }

        // Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        
        if (!fs.existsSync(schemaPath)) {
            console.log('[DB] schema.sql not found, skipping initialization');
            await connection.end();
            return;
        }

        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split queries by semicolon
        const queries = schema
            .split(';')
            .map(q => q.trim())
            .filter(q => q.length > 0);

        console.log(`[DB] Found ${queries.length} queries to execute`);

        // Execute each query
        for (let i = 0; i < queries.length; i++) {
            try {
                await connection.execute(queries[i]);
                console.log(`[DB] Query ${i + 1}/${queries.length} executed successfully`);
            } catch (error) {
                // Skip if table/database already exists
                if (error.code === 'ER_DB_CREATE_EXISTS' || 
                    error.code === 'ER_TABLE_EXISTS_ERROR' ||
                    error.message.includes('already exists')) {
                    console.log(`[DB] Query ${i + 1}/${queries.length} skipped (already exists)`);
                } else {
                    throw error;
                }
            }
        }

        await connection.end();
        console.log('[DB] Database initialization completed!');
        
    } catch (error) {
        console.error('[DB] Initialization error:', error.message);
        throw error;
    }
}

module.exports = initDatabase;
