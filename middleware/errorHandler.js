/**
 * =================================================
 * Global Error Handler Middleware
 * =================================================
 * 
 * Catches all unhandled errors in the Express pipeline.
 * Returns consistent JSON error responses.
 * Logs errors in development mode.
 */

/**
 * 404 Not Found handler for API routes
 * Place this BEFORE the global error handler
 */
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
        code: 'NOT_FOUND'
    });
};

/**
 * Global error handler middleware
 * Must have exactly 4 parameters (err, req, res, next) for Express to recognize it
 * 
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('═══════════════════════════════════');
        console.error('ERROR:', err.message);
        console.error('STACK:', err.stack);
        console.error('PATH:', req.method, req.originalUrl);
        console.error('═══════════════════════════════════');
    }

    // Default error status and message
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || 'Internal Server Error';
    let code = err.code || 'SERVER_ERROR';

    // Handle specific error types
    
    // MySQL duplicate entry error
    if (err.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        message = 'A record with this information already exists.';
        code = 'DUPLICATE_ENTRY';
    }

    // MySQL foreign key constraint error
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        statusCode = 400;
        message = 'Referenced record does not exist.';
        code = 'INVALID_REFERENCE';
    }

    // MySQL connection error
    if (err.code === 'ECONNREFUSED') {
        statusCode = 503;
        message = 'Database connection failed. Please try again later.';
        code = 'DB_CONNECTION_ERROR';
    }

    // Express body parser errors
    if (err.type === 'entity.parse.failed') {
        statusCode = 400;
        message = 'Invalid JSON in request body.';
        code = 'INVALID_JSON';
    }

    // Payload too large
    if (err.type === 'entity.too.large') {
        statusCode = 413;
        message = 'Request payload is too large. Maximum size is 10MB.';
        code = 'PAYLOAD_TOO_LARGE';
    }

    // Multer file upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        message = 'File is too large. Maximum size is 5MB.';
        code = 'FILE_TOO_LARGE';
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        statusCode = 400;
        message = 'Unexpected file field.';
        code = 'UNEXPECTED_FILE';
    }

    // Validation errors from express-validator
    if (err.array && typeof err.array === 'function') {
        statusCode = 400;
        message = 'Validation failed.';
        code = 'VALIDATION_ERROR';
    }

    // Build response object
    const errorResponse = {
        success: false,
        message,
        code
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }

    // Include validation errors if present
    if (err.errors) {
        errorResponse.errors = err.errors;
    }

    res.status(statusCode).json(errorResponse);
};

/**
 * Create a custom error with status code
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} Custom error with statusCode property
 */
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

module.exports = {
    errorHandler,
    notFoundHandler,
    createError
};
