/**
 * =================================================
 * Input Validation Middleware
 * =================================================
 * 
 * Reusable validation chains using express-validator.
 * Each export is an array of validation middleware for a specific route.
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Process validation results and return errors if any.
 * Use this as the LAST middleware in a validation chain.
 */
const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed.',
            code: 'VALIDATION_ERROR',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }
    
    next();
};

// =================================================
// AUTH VALIDATIONS
// =================================================

/** Validate signup request */
const validateSignup = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required.')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Please provide a valid email address.')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required.')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
        .matches(/\d/).withMessage('Password must contain at least one number.'),
    
    body('phone')
        .optional()
        .trim()
        .matches(/^[0-9]{10}$/).withMessage('Phone must be a 10-digit number.'),
    
    body('address')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Address must be under 500 characters.'),
    
    handleValidation
];

/** Validate login request */
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Please provide a valid email address.')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required.'),
    
    handleValidation
];

// =================================================
// FOOD VALIDATIONS
// =================================================

/** Validate food item creation/update */
const validateFood = [
    body('name')
        .trim()
        .notEmpty().withMessage('Food name is required.')
        .isLength({ min: 2, max: 150 }).withMessage('Name must be 2-150 characters.'),
    
    body('price')
        .notEmpty().withMessage('Price is required.')
        .isFloat({ min: 0.01 }).withMessage('Price must be a positive number.'),
    
    body('category')
        .trim()
        .notEmpty().withMessage('Category is required.')
        .isLength({ max: 50 }).withMessage('Category must be under 50 characters.'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must be under 1000 characters.'),
    
    body('is_veg')
        .optional()
        .isBoolean().withMessage('is_veg must be true or false.'),
    
    body('preparation_time')
        .optional()
        .isInt({ min: 1, max: 120 }).withMessage('Preparation time must be 1-120 minutes.'),
    
    body('is_available')
        .optional()
        .isBoolean().withMessage('is_available must be true or false.'),
    
    handleValidation
];

// =================================================
// CART VALIDATIONS
// =================================================

/** Validate add to cart */
const validateCartAdd = [
    body('food_id')
        .notEmpty().withMessage('Food item ID is required.')
        .isInt({ min: 1 }).withMessage('Food item ID must be a positive integer.'),
    
    body('quantity')
        .optional()
        .isInt({ min: 1, max: 50 }).withMessage('Quantity must be between 1 and 50.'),
    
    handleValidation
];

/** Validate cart item update */
const validateCartUpdate = [
    param('id')
        .isInt({ min: 1 }).withMessage('Cart item ID must be a positive integer.'),
    
    body('quantity')
        .notEmpty().withMessage('Quantity is required.')
        .isInt({ min: 1, max: 50 }).withMessage('Quantity must be between 1 and 50.'),
    
    handleValidation
];

// =================================================
// ORDER VALIDATIONS
// =================================================

/** Validate order placement */
const validateOrder = [
    body('delivery_address')
        .trim()
        .notEmpty().withMessage('Delivery address is required.')
        .isLength({ max: 500 }).withMessage('Address must be under 500 characters.'),
    
    body('delivery_lat')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.'),
    
    body('delivery_lng')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180.'),
    
    body('payment_method')
        .optional()
        .isIn(['cod', 'online', 'card', 'upi']).withMessage('Invalid payment method.'),
    
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Notes must be under 500 characters.'),
    
    handleValidation
];

/** Validate order status update */
const validateOrderStatus = [
    param('id')
        .isInt({ min: 1 }).withMessage('Order ID must be a positive integer.'),
    
    body('status')
        .notEmpty().withMessage('Status is required.')
        .isIn(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'])
        .withMessage('Invalid order status.'),
    
    handleValidation
];

// =================================================
// ROUTE VALIDATIONS
// =================================================

/** Validate route optimization request */
const validateRouteOptimize = [
    body('locations')
        .isArray({ min: 2 }).withMessage('At least 2 delivery locations are required.'),
    
    body('locations.*.lat')
        .isFloat({ min: -90, max: 90 }).withMessage('Each location must have a valid latitude.'),
    
    body('locations.*.lng')
        .isFloat({ min: -180, max: 180 }).withMessage('Each location must have a valid longitude.'),
    
    body('algorithm')
        .optional()
        .isIn(['greedy', 'held-karp', 'approximation', 'all'])
        .withMessage('Algorithm must be one of: greedy, held-karp, approximation, all.'),
    
    handleValidation
];

// =================================================
// COMMON VALIDATIONS
// =================================================

/** Validate an ID parameter */
const validateId = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID must be a positive integer.'),
    handleValidation
];

/** Validate profile update */
const validateProfileUpdate = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),
    
    body('phone')
        .optional()
        .trim()
        .matches(/^[0-9]{10}$/).withMessage('Phone must be a 10-digit number.'),
    
    body('address')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Address must be under 500 characters.'),
    
    body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90.'),
    
    body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180.'),
    
    handleValidation
];

module.exports = {
    handleValidation,
    validateSignup,
    validateLogin,
    validateFood,
    validateCartAdd,
    validateCartUpdate,
    validateOrder,
    validateOrderStatus,
    validateRouteOptimize,
    validateId,
    validateProfileUpdate
};
