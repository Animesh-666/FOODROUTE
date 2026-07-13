/**
 * =================================================
 * Role-Based Access Control Middleware
 * =================================================
 * 
 * Restricts route access based on user roles.
 * Must be used AFTER the authenticate middleware.
 * 
 * Supported roles: 'customer', 'admin', 'delivery_agent'
 */

/**
 * Create a role-checking middleware
 * Accepts one or more roles that are allowed to access the route.
 * 
 * @param {...string} allowedRoles - Roles that can access this route
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Only admins can access
 * router.get('/admin/dashboard', authenticate, roleCheck('admin'), controller.dashboard);
 * 
 * // Admins and delivery agents can access
 * router.get('/orders', authenticate, roleCheck('admin', 'delivery_agent'), controller.getOrders);
 */
const roleCheck = (...allowedRoles) => {
    return (req, res, next) => {
        // Ensure authenticate middleware has run first
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required before role check.',
                code: 'NOT_AUTHENTICATED'
            });
        }

        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`,
                code: 'INSUFFICIENT_ROLE',
                requiredRoles: allowedRoles,
                currentRole: req.user.role
            });
        }

        // Role is valid, proceed
        next();
    };
};

/**
 * Pre-configured role check for admin-only routes
 */
const adminOnly = roleCheck('admin');

/**
 * Pre-configured role check for delivery agent-only routes
 */
const deliveryAgentOnly = roleCheck('delivery_agent');

/**
 * Pre-configured role check for customer-only routes
 */
const customerOnly = roleCheck('customer');

/**
 * Pre-configured role check for admin and delivery agent routes
 */
const adminOrAgent = roleCheck('admin', 'delivery_agent');

module.exports = {
    roleCheck,
    adminOnly,
    deliveryAgentOnly,
    customerOnly,
    adminOrAgent
};
