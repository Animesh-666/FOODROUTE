/**
 * =================================================
 * Delivery Agent Model
 * =================================================
 * 
 * Handles database operations for the delivery_agents table.
 */

const db = require('../config/db');

class DeliveryAgent {
    /**
     * Get agent details by user ID
     */
    static async findByUserId(userId) {
        const [rows] = await db.execute(`
            SELECT da.*, u.name, u.email, u.phone 
            FROM delivery_agents da
            JOIN users u ON da.user_id = u.id
            WHERE da.user_id = ?
        `, [userId]);
        
        return rows[0] || null;
    }

    /**
     * Update agent's current location
     */
    static async updateLocation(agentId, lat, lng) {
        const [result] = await db.execute(
            'UPDATE delivery_agents SET current_lat = ?, current_lng = ?, last_location_update = NOW() WHERE id = ?',
            [lat, lng, agentId]
        );
        return result.affectedRows > 0;
    }

    /**
     * Update agent availability
     */
    static async updateAvailability(agentId, isAvailable) {
        const [result] = await db.execute(
            'UPDATE delivery_agents SET is_available = ? WHERE id = ?',
            [isAvailable, agentId]
        );
        return result.affectedRows > 0;
    }

    /**
     * Get all currently available agents
     */
    static async getAvailableAgents() {
        const [rows] = await db.execute(`
            SELECT da.id, da.current_lat, da.current_lng, da.vehicle_type, u.name
            FROM delivery_agents da
            JOIN users u ON da.user_id = u.id
            WHERE da.is_available = 1 AND u.is_active = 1
        `);
        return rows;
    }
}

module.exports = DeliveryAgent;
