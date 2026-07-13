/**
 * =================================================
 * Route Controller
 * =================================================
 * 
 * Handles API requests for DAA routing algorithms.
 */

const Route = require('../models/routeModel');
const DeliveryAgent = require('../models/deliveryAgentModel');
const comparator = require('../algorithms/tsp');
const db = require('../config/db');

// Central kitchen / Restaurant default coordinates (Delhi - Connaught Place)
const DEPOT_LAT = 28.6304;
const DEPOT_LNG = 77.2177;

/**
 * Get map data for the admin route planner
 * GET /api/routes/map-data
 */
const getMapData = async (req, res, next) => {
    try {
        // 1. Get all unassigned pending orders
        const orders = await Route.getUnassignedOrders();
        
        // 2. Get all active agents
        const agents = await DeliveryAgent.getAvailableAgents();
        
        // 3. Format depot
        const depot = {
            id: 'depot',
            name: 'Central Kitchen',
            lat: DEPOT_LAT,
            lng: DEPOT_LNG,
            type: 'restaurant'
        };
        
        res.json({
            success: true,
            data: {
                depot,
                orders: orders.map(o => ({
                    id: o.id,
                    tracking_id: o.tracking_id,
                    address: o.delivery_address,
                    lat: parseFloat(o.delivery_lat),
                    lng: parseFloat(o.delivery_lng),
                    status: o.status,
                    type: 'delivery'
                })),
                agents: agents.map(a => ({
                    id: a.id,
                    name: a.name,
                    lat: parseFloat(a.current_lat),
                    lng: parseFloat(a.current_lng),
                    type: 'agent'
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Calculate optimal route for selected orders using DAA algorithms
 * POST /api/routes/optimize
 * 
 * Body: {
 *   agent_id: integer (optional),
 *   order_ids: array of order IDs
 * }
 */
const optimizeRoute = async (req, res, next) => {
    try {
        const { agent_id, order_ids } = req.body;
        
        if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide array of order_ids' });
        }
        
        // Fetch full order data for the provided IDs directly from DB
        const [selectedOrders] = await db.execute(
            `SELECT id, tracking_id, delivery_address, delivery_lat, delivery_lng, status, agent_id 
             FROM orders 
             WHERE id IN (${order_ids.map(() => '?').join(',')})`,
            order_ids
        );
        
        if (selectedOrders.length === 0) {
            return res.status(404).json({ success: false, message: 'None of the provided orders were found' });
        }
        
        // Build locations array for the algorithm
        // Index 0 MUST be the depot/start point
        const locations = [{
            id: 'depot',
            name: 'Central Kitchen',
            lat: DEPOT_LAT,
            lng: DEPOT_LNG,
            type: 'restaurant'
        }];
        
        // Add delivery locations
        selectedOrders.forEach(order => {
            if (order.delivery_lat && order.delivery_lng) {
                locations.push({
                    id: order.id,
                    name: `Order #${order.tracking_id}`,
                    lat: parseFloat(order.delivery_lat),
                    lng: parseFloat(order.delivery_lng),
                    type: 'delivery'
                });
            }
        });
        
        // Run DAA algorithms
        const comparisonResult = comparator.compareAlgorithms(locations);
        
        res.json({
            success: true,
            data: comparisonResult
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMapData,
    optimizeRoute
};
