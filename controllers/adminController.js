/**
 * =================================================
 * Admin Controller
 * =================================================
 * 
 * Handles administrative dashboard and analytics.
 */

const db = require('../config/db');
const User = require('../models/userModel');
const Order = require('../models/orderModel');

/**
 * Get overall dashboard stats
 * GET /api/admin/dashboard
 */
const getDashboardStats = async (req, res, next) => {
    try {
        const [
            usersCount,
            ordersCount,
            revenueData,
            agentsCount,
            recentOrders
        ] = await Promise.all([
            User.countAll('customer'),
            Order.countAll(),
            db.execute('SELECT SUM(total_amount) as total FROM orders WHERE status = "delivered"'),
            User.countAll('delivery_agent'),
            Order.getRecentOrders(5)
        ]);

        res.json({
            success: true,
            data: {
                total_customers: usersCount,
                total_orders: ordersCount,
                total_revenue: revenueData[0][0].total || 0,
                total_agents: agentsCount,
                recent_orders: recentOrders
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get daily stats for charts
 * GET /api/admin/analytics/daily
 */
const getDailyAnalytics = async (req, res, next) => {
    try {
        const stats = await Order.getDailyStats();
        
        // Format for easy charting
        const labels = [];
        const orders = [];
        const revenue = [];
        
        stats.forEach(stat => {
            labels.push(stat.date);
            orders.push(stat.orders_count);
            revenue.push(parseFloat(stat.revenue || 0));
        });
        
        res.json({
            success: true,
            data: { labels, orders, revenue }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get paginated list of all users
 * GET /api/admin/users
 */
const getUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, role } = req.query;
        const offset = (page - 1) * limit;
        
        const users = await User.findAll(offset, limit, role);
        const total = await User.countAll(role);
        
        res.json({
            success: true,
            data: users,
            meta: {
                totalItems: total,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Toggle user active status
 * PUT /api/admin/users/:id/toggle-status
 */
const toggleUserStatus = async (req, res, next) => {
    try {
        const id = req.params.id;
        const newStatus = await User.toggleActive(id);
        
        res.json({
            success: true,
            message: `User account ${newStatus ? 'activated' : 'deactivated'}`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a user
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        
        // Cannot delete yourself
        if (parseInt(id) === req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You cannot delete your own admin account.'
            });
        }
        
        await User.delete(id);
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Register a delivery agent
 * POST /api/admin/agents
 */
const registerAgent = async (req, res, next) => {
    // Start transaction since we're inserting into two tables
    const connection = await db.getConnection();
    await connection.beginTransaction();
    
    try {
        const { name, email, password, phone, vehicle_type, vehicle_number } = req.body;
        
        // 1. Create user record
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const [userResult] = await connection.execute(
            'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, "delivery_agent")',
            [name, email, hashedPassword, phone]
        );
        
        const userId = userResult.insertId;
        
        // 2. Create agent record
        await connection.execute(
            'INSERT INTO delivery_agents (user_id, vehicle_type, vehicle_number) VALUES (?, ?, ?)',
            [userId, vehicle_type, vehicle_number]
        );
        
        await connection.commit();
        
        res.status(201).json({
            success: true,
            message: 'Delivery agent registered successfully'
        });
    } catch (error) {
        await connection.rollback();
        // Handle duplicate email
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Get all delivery agents
 * GET /api/admin/agents
 */
const getAgents = async (req, res, next) => {
    try {
        const [rows] = await db.execute(`
            SELECT u.id as user_id, u.name, u.email, u.phone, u.is_active, 
                   da.id as agent_id, da.vehicle_type, da.rating, da.is_available, da.current_lat, da.current_lng
            FROM users u
            JOIN delivery_agents da ON u.id = da.user_id
            WHERE u.role = 'delivery_agent'
        `);
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/agents/:id/route
 */
const getAgentRoute = async (req, res, next) => {
    try {
        const agentId = req.params.id;
        
        // 1. Fetch agent location
        const [agents] = await db.execute(`
            SELECT da.id as agent_id, u.name, da.vehicle_type, da.current_lat, da.current_lng
            FROM delivery_agents da
            JOIN users u ON da.user_id = u.id
            WHERE da.id = ?
        `, [agentId]);
        
        if (agents.length === 0) {
            return res.status(404).json({ success: false, message: 'Agent not found' });
        }
        
        const agent = agents[0];
        
        // 2. Fetch all active orders assigned to this agent (confirmed, preparing, out_for_delivery)
        const [orders] = await db.execute(`
            SELECT id, tracking_id, delivery_address, delivery_lat, delivery_lng, status
            FROM orders
            WHERE agent_id = ? AND status IN ('confirmed', 'preparing', 'out_for_delivery')
            ORDER BY created_at ASC
        `, [agentId]);
        
        res.json({
            success: true,
            data: {
                agent,
                orders: orders.map(o => ({
                    id: o.id,
                    tracking_id: o.tracking_id,
                    address: o.delivery_address,
                    lat: parseFloat(o.delivery_lat),
                    lng: parseFloat(o.delivery_lng),
                    status: o.status
                }))
            }
        });
        
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats,
    getDailyAnalytics,
    getUsers,
    toggleUserStatus,
    deleteUser,
    registerAgent,
    getAgents,
    getAgentRoute
};
