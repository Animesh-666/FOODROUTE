/**
 * =================================================
 * Cart Model
 * =================================================
 * 
 * Handles database operations for the cart table.
 */

const db = require('../config/db');

class Cart {
    /**
     * Get all cart items for a user
     * @param {number} userId 
     * @returns {Array} List of cart items with food details
     */
    static async getCart(userId) {
        const [rows] = await db.execute(`
            SELECT c.id as cart_id, c.quantity, 
                   f.id as food_id, f.name, f.price, f.image_url, f.is_available
            FROM cart c
            JOIN food_items f ON c.food_id = f.id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
        `, [userId]);
        
        return rows;
    }

    /**
     * Add item to cart or update quantity if already exists
     * @param {number} userId 
     * @param {number} foodId 
     * @param {number} quantity 
     */
    static async addItem(userId, foodId, quantity = 1) {
        // Check if item already exists in user's cart
        const [existing] = await db.execute(
            'SELECT id, quantity FROM cart WHERE user_id = ? AND food_id = ?',
            [userId, foodId]
        );

        if (existing.length > 0) {
            // Update quantity
            const newQty = existing[0].quantity + quantity;
            await db.execute('UPDATE cart SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
            return existing[0].id;
        } else {
            // Insert new cart item
            const [result] = await db.execute(
                'INSERT INTO cart (user_id, food_id, quantity) VALUES (?, ?, ?)',
                [userId, foodId, quantity]
            );
            return result.insertId;
        }
    }

    /**
     * Update cart item quantity
     * @param {number} cartId 
     * @param {number} quantity 
     * @returns {boolean}
     */
    static async updateQuantity(cartId, quantity) {
        const [result] = await db.execute(
            'UPDATE cart SET quantity = ? WHERE id = ?',
            [quantity, cartId]
        );
        return result.affectedRows > 0;
    }

    /**
     * Remove item from cart
     * @param {number} cartId 
     * @param {number} userId - Used for ownership verification
     * @returns {boolean}
     */
    static async removeItem(cartId, userId) {
        const [result] = await db.execute(
            'DELETE FROM cart WHERE id = ? AND user_id = ?',
            [cartId, userId]
        );
        return result.affectedRows > 0;
    }

    /**
     * Clear entire cart for a user
     * @param {number} userId 
     */
    static async clearCart(userId) {
        await db.execute('DELETE FROM cart WHERE user_id = ?', [userId]);
        return true;
    }

    /**
     * Get total amount of items in cart
     * @param {number} userId 
     * @returns {number} Subtotal
     */
    static async getCartTotal(userId) {
        const [rows] = await db.execute(`
            SELECT SUM(c.quantity * f.price) as subtotal
            FROM cart c
            JOIN food_items f ON c.food_id = f.id
            WHERE c.user_id = ? AND f.is_available = 1
        `, [userId]);
        
        return parseFloat(rows[0].subtotal || 0);
    }

    /**
     * Get count of distinct items in cart
     * @param {number} userId 
     * @returns {number}
     */
    static async getCartCount(userId) {
        const [rows] = await db.execute('SELECT COUNT(*) as count FROM cart WHERE user_id = ?', [userId]);
        return rows[0].count;
    }
}

module.exports = Cart;
