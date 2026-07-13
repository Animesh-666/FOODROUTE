/**
 * =================================================
 * Food Model
 * =================================================
 * 
 * Handles database operations for the food_items table.
 */

const db = require('../config/db');

class Food {
    /**
     * Find all food items with filtering, searching, and pagination
     * @param {Object} options - Query options
     * @returns {Object} { items, total }
     */
    static async findAll({ page = 1, limit = 12, category, search, is_veg, sort_by = 'created_at', sort_order = 'DESC' }) {
        let query = 'SELECT * FROM food_items WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as total FROM food_items WHERE 1=1';
        const params = [];

        // Apply filters
        if (category) {
            query += ' AND category = ?';
            countQuery += ' AND category = ?';
            params.push(category);
        }

        if (is_veg !== undefined && is_veg !== null) {
            query += ' AND is_veg = ?';
            countQuery += ' AND is_veg = ?';
            // ensure boolean is mapped correctly (0/1 or true/false depending on db driver)
            params.push(is_veg === 'true' || is_veg === true ? 1 : 0);
        }

        if (search) {
            // Using FULLTEXT search if index exists, else LIKE
            // Assuming basic LIKE for compatibility
            query += ' AND (name LIKE ? OR description LIKE ?)';
            countQuery += ' AND (name LIKE ? OR description LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern);
        }

        // Apply sorting (whitelist sort columns to prevent SQL injection)
        const allowedSortCols = ['price', 'rating', 'created_at', 'total_orders', 'name'];
        const actualSortBy = allowedSortCols.includes(sort_by) ? sort_by : 'created_at';
        const actualSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY ${actualSortBy} ${actualSortOrder}`;

        // Get total count for pagination metadata
        const [countRows] = await db.execute(countQuery, params);
        const total = countRows[0].total;

        // Apply pagination
        const offset = (page - 1) * limit;
        query += ' LIMIT ? OFFSET ?';
        
        // clone params for the actual data query
        const dataParams = [...params, parseInt(limit), parseInt(offset)];

        const [items] = await db.execute(query, dataParams);

        return { items, total };
    }

    /**
     * Find food item by ID
     * @param {number} id
     * @returns {Object|null}
     */
    static async findById(id) {
        const [rows] = await db.execute('SELECT * FROM food_items WHERE id = ?', [id]);
        return rows[0] || null;
    }

    /**
     * Get distinct categories
     * @returns {Array} List of categories
     */
    static async getCategories() {
        const [rows] = await db.execute('SELECT DISTINCT category FROM food_items ORDER BY category ASC');
        return rows.map(row => row.category);
    }

    /**
     * Create new food item (Admin)
     * @param {Object} data 
     * @returns {number} Inserted ID
     */
    static async create(data) {
        const { name, description, price, category, image_url, is_veg = true, preparation_time = 15 } = data;
        
        const [result] = await db.execute(
            `INSERT INTO food_items 
            (name, description, price, category, image_url, is_veg, preparation_time) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, description, price, category, image_url, is_veg, preparation_time]
        );
        
        return result.insertId;
    }

    /**
     * Update food item (Admin)
     * @param {number} id 
     * @param {Object} data 
     * @returns {boolean} Success
     */
    static async update(id, data) {
        const allowedFields = ['name', 'description', 'price', 'category', 'image_url', 'is_available', 'is_veg', 'preparation_time'];
        const updates = [];
        const params = [];

        Object.keys(data).forEach(key => {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = ?`);
                params.push(data[key]);
            }
        });

        if (updates.length === 0) return true;

        params.push(id);
        const [result] = await db.execute(`UPDATE food_items SET ${updates.join(', ')} WHERE id = ?`, params);
        
        return result.affectedRows > 0;
    }

    /**
     * Delete food item (Admin)
     * @param {number} id 
     * @returns {boolean} Success
     */
    static async delete(id) {
        const [result] = await db.execute('DELETE FROM food_items WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Food;
