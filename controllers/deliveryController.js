/**
 * =================================================
 * Delivery Agent Controller
 * =================================================
 * 
 * Handles API requests for the delivery agent dashboard.
 */

const db = require('../config/db');
const DeliveryAgent = require('../models/deliveryAgentModel');

/**
 * Get the delivery agent's active profile and stats
 * GET /api/delivery/dashboard
 */
const getDashboard = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const agent = await DeliveryAgent.findByUserId(userId);
        
        if (!agent) {
            return res.status(404).json({ success: false, message: 'Agent profile not found' });
        }
        
        // Get active orders (assigned to this agent, status 'out_for_delivery')
        const [activeOrders] = await db.execute(`
            SELECT id, tracking_id, delivery_address, delivery_lat, delivery_lng, 
                   total_amount, payment_method, customer_name, customer_phone, items_summary
            FROM orders
            WHERE agent_id = ? AND status = 'out_for_delivery'
        `, [agent.id]);
        
        // Get today's stats
        const [todayStats] = await db.execute(`
            SELECT COUNT(id) as total_deliveries, SUM(total_amount) as total_value
            FROM orders
            WHERE agent_id = ? AND status = 'delivered' AND DATE(updated_at) = CURDATE()
        `, [agent.id]);

        res.json({
            success: true,
            data: {
                profile: agent,
                active_orders: activeOrders,
                stats: {
                    today_deliveries: todayStats[0].total_deliveries || 0,
                    today_value: todayStats[0].total_value || 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update agent availability (online/offline)
 * PUT /api/delivery/availability
 */
const updateAvailability = async (req, res, next) => {
    try {
        const { is_available } = req.body;
        const userId = req.user.id;
        
        const agent = await DeliveryAgent.findByUserId(userId);
        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
        
        await DeliveryAgent.updateAvailability(agent.id, is_available ? 1 : 0);
        
        res.json({
            success: true,
            message: `You are now ${is_available ? 'Online' : 'Offline'}`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update agent's current GPS location
 * PUT /api/delivery/location
 */
const updateLocation = async (req, res, next) => {
    try {
        const { lat, lng } = req.body;
        const userId = req.user.id;
        
        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: 'Latitude and longitude required' });
        }
        
        const agent = await DeliveryAgent.findByUserId(userId);
        if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
        
        await DeliveryAgent.updateLocation(agent.id, lat, lng);
        
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark an order as delivered
 * PUT /api/delivery/orders/:id/deliver
 */
const markDelivered = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;
        
        const agent = await DeliveryAgent.findByUserId(userId);
        
        // Verify this order belongs to this agent
        const [orders] = await db.execute('SELECT status FROM orders WHERE id = ? AND agent_id = ?', [orderId, agent.id]);
        
        if (orders.length === 0) {
            return res.status(403).json({ success: false, message: 'Not authorized for this order' });
        }
        
        if (orders[0].status === 'delivered') {
            return res.status(400).json({ success: false, message: 'Order is already delivered' });
        }
        
        await db.execute('UPDATE orders SET status = "delivered" WHERE id = ?', [orderId]);
        
        res.json({
            success: true,
            message: 'Order marked as delivered successfully!'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard,
    updateAvailability,
    updateLocation,
    markDelivered
};
