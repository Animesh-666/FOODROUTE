/**
 * =================================================
 * Order Model
 * =================================================
 * 
 * Handles database operations for orders and order_items tables.
 */

const db = require('../config/db');

class Order {
    /**
     * Create a new order
     * @param {number} userId 
     * @param {Object} orderData 
     * @returns {number} Inserted order ID
     */
    static async create(userId, orderData) {
        const { total_amount, delivery_address, delivery_lat, delivery_lng, payment_method, notes, tracking_id } = orderData;
        
        const [result] = await db.execute(
            `INSERT INTO orders 
            (user_id, total_amount, delivery_address, delivery_lat, delivery_lng, payment_method, notes, tracking_id, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [userId, total_amount, delivery_address, delivery_lat || null, delivery_lng || null, payment_method || 'cod', notes || null, tracking_id]
        );
        
        return result.insertId;
    }

    /**
     * Bulk insert items for an order
     * @param {number} orderId 
     * @param {Array} items - Array of {food_id, quantity, price, name}
     */
    static async addItems(orderId, items) {
        if (!items || items.length === 0) return;
        
        const values = [];
        const placeholders = [];
        
        items.forEach(item => {
            placeholders.push('(?, ?, ?, ?, ?)');
            values.push(orderId, item.food_id, item.quantity, item.price, item.name);
        });
        
        const query = `INSERT INTO order_items (order_id, food_id, quantity, price, food_name) VALUES ${placeholders.join(', ')}`;
        await db.execute(query, values);
    }

    /**
     * Get paginated orders for a specific user
     * @param {number} userId 
     * @param {number} page 
     * @param {number} limit 
     * @returns {Array} Orders list
     */
    static async findByUser(userId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        
        const [rows] = await db.execute(
            'SELECT id, total_amount, status, tracking_id, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [userId, parseInt(limit), parseInt(offset)]
        );
        
        // Fetch brief item summary for each order (optional optimization: could be a joined subquery, but fine for now)
        for (let order of rows) {
            const [items] = await db.execute('SELECT quantity, food_name FROM order_items WHERE order_id = ?', [order.id]);
            order.items_summary = items.map(i => `${i.quantity}x ${i.food_name}`).join(', ');
        }
        
        return rows;
    }

    /**
     * Count total orders for a user
     * @param {number} userId 
     */
    static async countByUser(userId) {
        const [rows] = await db.execute('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [userId]);
        return rows[0].count;
    }

    /**
     * Get basic order details
     * @param {number} orderId 
     */
    static async findById(orderId) {
        const [rows] = await db.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
        return rows[0] || null;
    }

    /**
     * Get comprehensive order details including items, user, and agent info
     * @param {number} orderId 
     */
    static async getOrderDetails(orderId) {
        // 1. Get main order with customer details
        const [orders] = await db.execute(`
            SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = ?
        `, [orderId]);
        
        if (orders.length === 0) return null;
        const order = orders[0];
        
        // 2. Get order items
        const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
        order.items = items;
        
        // 3. Get delivery agent info if assigned
        if (order.agent_id) {
            const [agents] = await db.execute(`
                SELECT da.id, u.name, u.phone, da.vehicle_type, da.rating, da.current_lat, da.current_lng 
                FROM delivery_agents da 
                JOIN users u ON da.user_id = u.id 
                WHERE da.id = ?
            `, [order.agent_id]);
            order.agent = agents[0] || null;
        } else {
            order.agent = null;
        }
        
        return order;
    }

    /**
     * Update order status
     * @param {number} orderId 
     * @param {string} status 
     */
    static async updateStatus(orderId, status) {
        let query = 'UPDATE orders SET status = ?';
        const params = [status];
        
        if (status === 'delivered') {
            query += ', delivered_at = NOW()';
        }
        
        query += ' WHERE id = ?';
        params.push(orderId);
        
        const [result] = await db.execute(query, params);
        return result.affectedRows > 0;
    }

    /**
     * Admin: Get all orders (paginated, filterable)
     */
    static async findAll(page = 1, limit = 10, status = null) {
        let query = `
            SELECT o.id, o.total_amount, o.status, o.tracking_id, o.created_at, 
                   u.name as customer_name, au.name as agent_name 
            FROM orders o 
            JOIN users u ON o.user_id = u.id
            LEFT JOIN delivery_agents da ON o.agent_id = da.id
            LEFT JOIN users au ON da.user_id = au.id
        `;
        const params = [];
        
        if (status) {
            query += ' WHERE o.status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt((page - 1) * limit));
        
        const [rows] = await db.execute(query, params);
        return rows;
    }

    /**
     * Admin: Count total orders
     */
    static async countAll(status = null) {
        let query = 'SELECT COUNT(*) as count FROM orders';
        const params = [];
        
        if (status) {
            query += ' WHERE status = ?';
            params.push(status);
        }
        
        const [rows] = await db.execute(query, params);
        return rows[0].count;
    }

    /**
     * Admin: Assign delivery agent
     */
    static async assignAgent(orderId, agentId) {
        const [result] = await db.execute('UPDATE orders SET agent_id = ? WHERE id = ?', [agentId, orderId]);
        return result.affectedRows > 0;
    }

    /**
     * Admin Dashboard: Get recent orders
     */
    static async getRecentOrders(limit = 5) {
        const [rows] = await db.execute(`
            SELECT o.id, o.tracking_id, o.total_amount, o.status, o.created_at, u.name as customer_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT ?
        `, [parseInt(limit)]);
        return rows;
    }

    /**
     * Admin Dashboard: Get daily stats (last 7 days)
     */
    static async getDailyStats() {
        const [rows] = await db.execute(`
            SELECT DATE(created_at) as date, COUNT(*) as orders_count, SUM(total_amount) as revenue
            FROM orders
            WHERE created_at >= DATE(NOW()) - INTERVAL 6 DAY
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);
        return rows;
    }
}

module.exports = Order;
