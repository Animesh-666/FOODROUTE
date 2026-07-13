/**
 * =================================================
 * Application Constants
 * =================================================
 * 
 * Centralized constants used throughout the application.
 */

module.exports = {
    // User roles
    ROLES: {
        CUSTOMER: 'customer',
        ADMIN: 'admin',
        DELIVERY_AGENT: 'delivery_agent'
    },

    // Order statuses
    ORDER_STATUS: {
        PENDING: 'pending',
        CONFIRMED: 'confirmed',
        PREPARING: 'preparing',
        OUT_FOR_DELIVERY: 'out_for_delivery',
        DELIVERED: 'delivered',
        CANCELLED: 'cancelled'
    },

    // Order status flow (valid transitions)
    ORDER_STATUS_FLOW: {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['preparing', 'cancelled'],
        preparing: ['out_for_delivery', 'cancelled'],
        out_for_delivery: ['delivered'],
        delivered: [],
        cancelled: []
    },

    // Route statuses
    ROUTE_STATUS: {
        PLANNED: 'planned',
        IN_PROGRESS: 'in_progress',
        COMPLETED: 'completed'
    },

    // Payment methods
    PAYMENT_METHODS: ['cod', 'online', 'card', 'upi'],

    // Food categories
    FOOD_CATEGORIES: [
        'Burgers',
        'Pizza',
        'Biryani',
        'Chinese',
        'South Indian',
        'North Indian',
        'Desserts',
        'Beverages',
        'Snacks',
        'Salads',
        'Thali',
        'Rolls & Wraps'
    ],

    // Algorithm names
    ALGORITHMS: {
        GREEDY: 'greedy',
        HELD_KARP: 'held-karp',
        APPROXIMATION: 'approximation',
        ALL: 'all'
    },

    // Delivery settings
    DELIVERY: {
        AVERAGE_SPEED_KMH: parseInt(process.env.AVERAGE_SPEED_KMH) || 30,
        MAX_TSP_NODES: parseInt(process.env.MAX_TSP_NODES) || 20,
        PREPARATION_BUFFER_MIN: 10  // Extra minutes for food preparation
    },

    // Default restaurant location (depot)
    RESTAURANT: {
        LAT: parseFloat(process.env.RESTAURANT_LAT) || 28.6139,
        LNG: parseFloat(process.env.RESTAURANT_LNG) || 77.2090,
        NAME: process.env.RESTAURANT_NAME || 'FoodRoute Kitchen'
    },

    // Pagination defaults
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 12,
        MAX_LIMIT: 100
    },

    // Earth radius in km (for Haversine formula)
    EARTH_RADIUS_KM: 6371
};
