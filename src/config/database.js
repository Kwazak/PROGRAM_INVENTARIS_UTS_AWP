const mysql = require('mysql2');
require('dotenv').config();

/**
 * Database Configuration Module
 * Centralized database connection management
 */

const dbConfig = {
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

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Promisify for async/await
const promisePool = pool.promise();

/**
 * Test database connection
 */
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Database connected successfully');
        console.log(`   Host: ${dbConfig.host}`);
        console.log(`   Database: ${dbConfig.database}`);
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
