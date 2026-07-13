/**
 * =================================================
 * Utility / Helper Functions
 * =================================================
 * 
 * Shared helper functions used across controllers and models.
 */

const jwt = require('jsonwebtoken');
const { EARTH_RADIUS_KM } = require('./constants');

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object with id, email, role, name
 * @returns {string} Signed JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

/**
 * Calculate Haversine distance between two GPS coordinates
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lon1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lon2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in kilometers
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => deg * (Math.PI / 180);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
};

/**
 * Format currency in Indian Rupees
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string (e.g., "₹ 249.00")
 */
const formatCurrency = (amount) => {
    return `₹ ${parseFloat(amount).toFixed(2)}`;
};

/**
 * Calculate estimated delivery time
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} avgSpeedKmh - Average speed in km/h (default: 30)
 * @param {number} prepTimeMin - Food preparation time in minutes (default: 10)
 * @returns {number} Estimated time in minutes
 */
const estimateDeliveryTime = (distanceKm, avgSpeedKmh = 30, prepTimeMin = 10) => {
    const travelTimeMin = (distanceKm / avgSpeedKmh) * 60;
    return Math.ceil(travelTimeMin + prepTimeMin);
};

/**
 * Paginate query results
 * @param {number} page - Current page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} { offset, limit } for SQL LIMIT clause
 */
const paginate = (page = 1, limit = 12) => {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    return { offset, limit: limitNum, page: pageNum };
};

/**
 * Build pagination metadata for API responses
 * @param {number} totalItems - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const buildPaginationMeta = (totalItems, page, limit) => {
    const totalPages = Math.ceil(totalItems / limit);
    return {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };
};

/**
 * Sanitize a string to prevent basic XSS
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
const sanitize = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
};

/**
 * Generate a random order tracking ID
 * @returns {string} Tracking ID (e.g., "FD-2025-A3B7C9")
 */
const generateTrackingId = () => {
    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `FD-${year}-${code}`;
};

/**
 * Check if a value is a valid positive integer
 * @param {*} value - Value to check
 * @returns {boolean}
 */
const isValidId = (value) => {
    const num = parseInt(value);
    return !isNaN(num) && num > 0 && num === Number(value);
};

module.exports = {
    generateToken,
    haversineDistance,
    formatCurrency,
    estimateDeliveryTime,
    paginate,
    buildPaginationMeta,
    sanitize,
    generateTrackingId,
    isValidId
};
