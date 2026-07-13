/**
 * =================================================
 * Order Controller
 * =================================================
 * 
 * Handles order placement, tracking, and management.
 */

const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const db = require('../config/db');
const { generateTrackingId, buildPaginationMeta, paginate } = require('../utils/helpers');
const { ORDER_STATUS_FLOW } = require('../utils/constants');

/**
 * Place a new order from cart
 * POST /api/orders
 */
const placeOrder = async (req, res, next) => {
    // Start transaction since we're touching multiple tables
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const userId = req.user.id;
        const { delivery_address, delivery_lat, delivery_lng, payment_method, notes } = req.body;
        
        // 1. Get cart items
        const cartItems = await Cart.getCart(userId);
        
        if (cartItems.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot place order: Cart is empty'
            });
        }
        
        // 2. Check availability and calculate true total
        let subtotal = 0;
        const orderItemsData = [];
        
        for (let item of cartItems) {
            if (!item.is_available) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Cannot place order: ${item.name} is currently unavailable`
                });
            }
            
            subtotal += item.price * item.quantity;
            orderItemsData.push({
                food_id: item.food_id,
                quantity: item.quantity,
                price: item.price,
                name: item.name
            });
        }
        
        // Fixed delivery fee + tax (simplified)
        const deliveryFee = 40;
        const taxAmount = subtotal * 0.05;
        const totalAmount = subtotal + deliveryFee + taxAmount;
        
        // 3. Create order record
        const trackingId = generateTrackingId();
        
        const [orderResult] = await connection.execute(
            `INSERT INTO orders 
            (user_id, total_amount, delivery_address, delivery_lat, delivery_lng, payment_method, notes, tracking_id, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [userId, totalAmount, delivery_address, delivery_lat || null, delivery_lng || null, payment_method || 'cod', notes || null, trackingId]
        );
        
        const orderId = orderResult.insertId;
        
        // 4. Create order items records (bulk insert via loop for simplicity inside transaction)
        for (let item of orderItemsData) {
            await connection.execute(
                `INSERT INTO order_items (order_id, food_id, quantity, price, food_name) 
                 VALUES (?, ?, ?, ?, ?)`,
                [orderId, item.food_id, item.quantity, item.price, item.name]
            );
        }
        
        // 5. Clear the user's cart
        await connection.execute('DELETE FROM cart WHERE user_id = ?', [userId]);
        
        // Commit transaction
        await connection.commit();
        
        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: {
                order_id: orderId,
                tracking_id: trackingId,
                total_amount: totalAmount,
                status: 'pending'
            }
        });
        
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

/**
 * Get customer's own order history
 * GET /api/orders
 */
const getMyOrders = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { page, limit } = req.query;
        
        const pagination = paginate(page, limit);
        
        const orders = await Order.findByUser(userId, pagination.page, pagination.limit);
        const total = await Order.countByUser(userId);
        
        res.json({
            success: true,
            data: orders,
            meta: buildPaginationMeta(total, pagination.page, pagination.limit)
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get details for a single order
 * GET /api/orders/:id
 */
const getOrderDetails = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;
        
        const order = await Order.getOrderDetails(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Access control: Only admins, assigned agent, or the order owner can view details
        if (userRole === 'customer' && order.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You can only view your own orders'
            });
        }
        
        if (userRole === 'delivery_agent') {
            // Need to verify if agent is assigned to this order
            const [agentRecord] = await db.execute('SELECT id FROM delivery_agents WHERE user_id = ?', [userId]);
            const agentId = agentRecord[0]?.id;
            
            if (order.agent_id !== agentId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You are not assigned to this order'
                });
            }
        }
        
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all orders (Admin only)
 * GET /api/orders/all
 */
const getAllOrders = async (req, res, next) => {
    try {
        const { page, limit, status } = req.query;
        
        const pagination = paginate(page, limit);
        
        const orders = await Order.findAll(pagination.page, pagination.limit, status);
        const total = await Order.countAll(status);
        
        res.json({
            success: true,
            data: orders,
            meta: buildPaginationMeta(total, pagination.page, pagination.limit)
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update order status (Admin or Agent)
 * PUT /api/orders/:id/status
 */
const updateStatus = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;
        const userRole = req.user.role;
        
        // 1. Fetch current order
        const order = await Order.findById(orderId);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // 2. Validate status transition (Admins bypass the transition flow check)
        if (userRole !== 'admin') {
            const validNextStatuses = ORDER_STATUS_FLOW[order.status] || [];
            
            if (!validNextStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status transition from '${order.status}' to '${status}'`
                });
            }
        }
        
        // 3. Update status
        await Order.updateStatus(orderId, status);
        
        res.json({
            success: true,
            message: `Order status updated to ${status}`
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Assign delivery agent to order (Admin only)
 * PUT /api/orders/:id/assign
 */
const assignAgent = async (req, res, next) => {
    try {
        const orderId = req.params.id;
        const { agent_id } = req.body;
        
        const success = await Order.assignAgent(orderId, agent_id);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Delivery agent assigned successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    placeOrder,
    getMyOrders,
    getOrderDetails,
    getAllOrders,
    updateStatus,
    assignAgent
};
