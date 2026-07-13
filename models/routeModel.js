/**
 * =================================================
 * Route Model
 * =================================================
 * 
 * Handles database operations for the routes and route_stops tables.
 */

const db = require('../config/db');

class Route {
    /**
     * Create a new route optimization record
     */
    static async create(agentId, totalDistance, estimatedTime, algorithmUsed, executionTime) {
        const [result] = await db.execute(
            `INSERT INTO routes (agent_id, total_distance, estimated_time, algorithm_used, execution_time) 
             VALUES (?, ?, ?, ?, ?)`,
            [agentId, totalDistance, estimatedTime, algorithmUsed, executionTime]
        );
        return result.insertId;
    }

    /**
     * Add stops to a route
     */
    static async addStops(routeId, stops) {
        if (!stops || stops.length === 0) return;
        
        const values = stops.map((stop, index) => [
            routeId, 
            stop.orderId || null, 
            stop.type, // 'restaurant', 'delivery', 'agent_location'
            stop.lat, 
            stop.lng, 
            index // stop_order
        ]);
        
        // Flatten values for bulk insert
        const flattenedValues = values.flat();
        const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
        
        await db.execute(
            `INSERT INTO route_stops (route_id, order_id, stop_type, latitude, longitude, stop_order) 
             VALUES ${placeholders}`,
            flattenedValues
        );
    }

    /**
     * Get unassigned orders (pending, confirmed, preparing)
     */
    static async getUnassignedOrders() {
        const [rows] = await db.execute(`
            SELECT id, tracking_id, delivery_address, delivery_lat, delivery_lng, status, created_at
            FROM orders
            WHERE agent_id IS NULL AND status IN ('pending', 'confirmed', 'preparing')
            ORDER BY created_at ASC
        `);
        return rows;
    }
}

module.exports = Route;
