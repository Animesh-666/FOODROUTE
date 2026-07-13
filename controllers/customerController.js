/**
 * =================================================
 * Customer Controller
 * =================================================
 * 
 * Handles customer dashboard stats.
 */

const db = require('../config/db');

/**
 * Get customer dashboard stats
 * GET /api/customer/dashboard
 */
const getDashboard = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // Use parallel queries for better performance
        const [ordersResult, activeOrdersResult, spentResult] = await Promise.all([
            // Total orders count
            db.execute('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [userId]),
            
            // Active orders count (not delivered or cancelled)
            db.execute('SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND status NOT IN ("delivered", "cancelled")', [userId]),
            
            // Total spent
            db.execute('SELECT SUM(total_amount) as total FROM orders WHERE user_id = ? AND status != "cancelled"', [userId])
        ]);
        
        res.json({
            success: true,
            data: {
                total_orders: ordersResult[0][0].count,
                active_orders: activeOrdersResult[0][0].count,
                total_spent: spentResult[0][0].total || 0
            }
        });
        
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard
};
