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
 * Auto-initialize Database Schema if empty
 */
async function initDatabaseSchema() {
    try {
        // Check if users table exists
        const [tables] = await pool.query("SHOW TABLES LIKE 'users'");
        if (tables.length > 0) {
            console.log("ℹ️ Database schema already initialized.");
            return;
        }

        console.log("⚠️ Database schema not initialized. Initializing now...");
        
        const fs = require('fs');
        const path = require('path');
        const sqlPath = path.join(__dirname, '..', 'database', 'schema.sql');
        
        if (!fs.existsSync(sqlPath)) {
            console.error("❌ Schema file not found at:", sqlPath);
            return;
        }

        let sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Remove comments
        sql = sql.replace(/--.*$/gm, '');
        
        // Split statements by semicolon
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => {
                if (!s) return false;
                const lower = s.toLowerCase();
                if (lower.startsWith('create database') || lower.startsWith('use ')) return false;
                return true;
            });

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            for (let statement of statements) {
                await connection.query(statement);
            }
            await connection.commit();
            console.log("✅ Database schema initialized successfully with seed data!");
        } catch (err) {
            await connection.rollback();
            console.error("❌ Failed to initialize database schema:", err.message);
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error("❌ Error checking/initializing database:", err.message);
    }
}

/**
 * Test Database Connection
 */
async function testConnection() {
    try {
        const connection = await pool.getConnection();

        console.log("✅ MySQL Database Connected Successfully!");

        connection.release();

        // Run auto-init
        await initDatabaseSchema();
    } catch (err) {
        console.error("❌ Database Connection Failed!");
        console.error(err.message);

        process.exit(1);
    }
}

testConnection();

module.exports = pool;