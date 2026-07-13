/**
 * =================================================
 * User Model
 * =================================================
 * 
 * Handles database operations for the users table.
 */

const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    /**
     * Find a user by their email address
     * @param {string} email
     * @returns {Object|null} User record or null
     */
    static async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0] || null;
    }

    /**
     * Find a user by ID (excludes password)
     * @param {number} id
     * @returns {Object|null} User record or null
     */
    static async findById(id) {
        const [rows] = await db.execute(
            'SELECT id, name, email, phone, address, latitude, longitude, role, is_active, created_at, updated_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    /**
     * Create a new user
     * @param {Object} userData
     * @returns {number} Inserted user ID
     */
    static async create(userData) {
        const { name, email, password, phone, address, latitude, longitude, role = 'customer' } = userData;
        
        const [result] = await db.execute(
            `INSERT INTO users 
            (name, email, password, phone, address, latitude, longitude, role) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, password, phone || null, address || null, latitude || null, longitude || null, role]
        );
        
        return result.insertId;
    }

    /**
     * Update user profile information
     * @param {number} id
     * @param {Object} updateData
     * @returns {boolean} Success status
     */
    static async updateProfile(id, updateData) {
        const { name, phone, address, latitude, longitude } = updateData;
        
        // Build dynamic query based on provided fields
        const updates = [];
        const params = [];
        
        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
        if (address !== undefined) { updates.push('address = ?'); params.push(address); }
        if (latitude !== undefined) { updates.push('latitude = ?'); params.push(latitude); }
        if (longitude !== undefined) { updates.push('longitude = ?'); params.push(longitude); }
        
        if (updates.length === 0) return true;
        
        params.push(id);
        
        const [result] = await db.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
        
        return result.affectedRows > 0;
    }

    /**
     * Update user password
     * @param {number} id
     * @param {string} hashedPassword
     * @returns {boolean} Success status
     */
    static async updatePassword(id, hashedPassword) {
        const [result] = await db.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );
        return result.affectedRows > 0;
    }

    /**
     * Get paginated list of all users, optionally filtered by role
     * @param {number} offset
     * @param {number} limit
     * @param {string} role (optional)
     * @returns {Array} List of users
     */
    static async findAll(offset, limit, role = null) {
        let query = 'SELECT id, name, email, phone, role, is_active, created_at FROM users';
        const params = [];
        
        if (role) {
            query += ' WHERE role = ?';
            params.push(role);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        // MySQL expects limit and offset to be integers
        params.push(parseInt(limit), parseInt(offset));
        
        const [rows] = await db.execute(query, params);
        return rows;
    }

    /**
     * Count total users, optionally filtered by role
     * @param {string} role (optional)
     * @returns {number} Total count
     */
    static async countAll(role = null) {
        let query = 'SELECT COUNT(*) as total FROM users';
        const params = [];
        
        if (role) {
            query += ' WHERE role = ?';
            params.push(role);
        }
        
        const [rows] = await db.execute(query, params);
        return rows[0].total;
    }

    /**
     * Toggle a user's active status (suspend/activate)
     * @param {number} id
     * @returns {boolean} New active status
     */
    static async toggleActive(id) {
        // First get current status
        const [rows] = await db.execute('SELECT is_active FROM users WHERE id = ?', [id]);
        if (rows.length === 0) throw new Error('User not found');
        
        const newStatus = !rows[0].is_active;
        
        await db.execute('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);
        
        return newStatus;
    }

    /**
     * Delete a user completely
     * @param {number} id
     * @returns {boolean} Success status
     */
    static async delete(id) {
        const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = User;
