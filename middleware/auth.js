/**
 * =================================================
 * JWT Authentication Middleware
 * =================================================
 * 
 * Verifies JWT tokens from Authorization header.
 * Attaches decoded user data to req.user.
 * Used to protect authenticated routes.
 */

const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * Authenticate user via JWT token
 * 
 * Expects header: Authorization: Bearer <token>
 * On success: sets req.user = { id, email, role, name }
 * On failure: returns 401 Unauthorized
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
        }

        // Check Bearer format
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format. Use: Bearer <token>',
                code: 'INVALID_FORMAT'
            });
        }

        // Extract token (remove "Bearer " prefix)
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Token is empty.',
                code: 'EMPTY_TOKEN'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify user still exists in database (handles reset database gracefully)
        const [userRows] = await db.execute('SELECT id FROM users WHERE id = ?', [decoded.id]);
        if (userRows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Your account no longer exists. Please register or login again.',
                code: 'USER_NOT_FOUND'
            });
        }

        // Attach user data to request object
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            name: decoded.name
        };

        next();
    } catch (error) {
        // Handle specific JWT errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please login again.',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.',
                code: 'INVALID_TOKEN'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication error.',
            code: 'AUTH_ERROR'
        });
    }
};

/**
 * Optional authentication - sets req.user if token present, 
 * but doesn't block if no token
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = {
                    id: decoded.id,
                    email: decoded.email,
                    role: decoded.role,
                    name: decoded.name
                };
            }
        }
    } catch (error) {
        // Silently ignore - user just won't be authenticated
        req.user = null;
    }
    
    next();
};

module.exports = { authenticate, optionalAuth };
