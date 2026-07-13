/**
 * =================================================
 * Database Configuration
 * =================================================
 * MySQL Connection Pool using mysql2/promise
 */

require("dotenv").config();

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    enableKeepAlive: true,
    keepAliveInitialDelay: 0,

    charset: "utf8mb4",
    timezone: "+05:30",
    dateStrings: true
});

/**
 * Test Database Connection
 */
async function testConnection() {
    try {
        const connection = await pool.getConnection();

        console.log("✅ MySQL Database Connected Successfully!");

        connection.release();
    } catch (err) {
        console.error("❌ Database Connection Failed!");
        console.error(err.message);

        process.exit(1);
    }
}

testConnection();

module.exports = pool;