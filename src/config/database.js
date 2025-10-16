const mysql = require('mysql2');
require('dotenv').config();

/**
 * Database Configuration Module
 * Centralized database connection management
 */

let dbConfig;
let pool;

// Check if Railway MYSQL_URL exists
if (process.env.MYSQL_URL) {
    console.log('✅ Using MYSQL_URL from Railway environment');
    
    // Railway provides full MySQL URL
    dbConfig = process.env.MYSQL_URL;
    
    pool = mysql.createPool({
        uri: process.env.MYSQL_URL,
        waitForConnections: true,
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
        queueLimit: 0,
        multipleStatements: true,
        timezone: '+00:00'
    });
} else {
    console.log('📝 Using traditional database config from .env');
    
    // Traditional separate config for local development
    dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'factory_inventory',
        waitForConnections: true,
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
        queueLimit: 0,
        multipleStatements: true,
        timezone: '+00:00'
    };
    
    pool = mysql.createPool(dbConfig);
}

// Promisify for async/await
const promisePool = pool.promise();

/**
 * Test database connection
 */
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Database connected successfully');
        
        if (process.env.MYSQL_URL) {
            console.log('   Connected to Railway MySQL');
        } else {
            console.log(`   Host: ${dbConfig.host}`);
            console.log(`   Database: ${dbConfig.database}`);
        }
        
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('   Please check your database configuration in .env file');
        return false;
    }
};

/**
 * Get connection pool statistics
 */
const getPoolStats = () => {
    return {
        connections: pool._allConnections.length,
        freeConnections: pool._freeConnections.length,
        queuedRequests: pool._connectionQueue.length
    };
};

module.exports = {
    pool,
    promisePool,
    testConnection,
    getPoolStats,
    dbConfig
};
