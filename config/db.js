/**
 * =================================================
 * Database Configuration
 * =================================================
 * 
 * MySQL connection pool using mysql2/promise.
 * Uses environment variables for configuration.
 * Connection pooling for better performance.
 */

const mysql = require('mysql2/promise');

// Create connection pool with optimized settings
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'smart_food_delivery',
    
    // Pool configuration
    waitForConnections: true,
    connectionLimit: 10,       // Max simultaneous connections
    queueLimit: 0,             // Unlimited queue (0 = no limit)
    enableKeepAlive: true,     // Keep connections alive
    keepAliveInitialDelay: 0,  // Initial delay for keep-alive
    
    // Timezone and charset
    timezone: '+05:30',        // IST timezone
    charset: 'utf8mb4',       // Support emojis and special chars
    
    // Date handling
    dateStrings: true,         // Return dates as strings (not JS Date objects)
    
    // Debug (disable in production)
    // debug: process.env.NODE_ENV === 'development'
});

/**
 * Execute a parameterized SQL query
 * @param {string} sql - SQL query string with ? placeholders
 * @param {Array} params - Parameters to bind to placeholders
 * @returns {Promise<Array>} Query results
 * 
 * @example
 * const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [1]);
 */

/**
 * Test the database connection
 * @returns {Promise<boolean>} True if connection successful
 */
pool.testConnection = async function() {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection test failed:', error.message);
        return false;
    }
};

module.exports = pool;
