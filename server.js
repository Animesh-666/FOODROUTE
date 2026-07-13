/**
 * =================================================
 * Smart Food Delivery Route Planner
 * Main Server Entry Point
 * =================================================
 * 
 * Express.js server with MVC architecture.
 * Handles API routes, static files, and middleware.
 * 
 * @author Animesh
 * @version 1.0.0
 */

// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Import database connection
const db = require('./config/db');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const foodRoutes = require('./routes/foodRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const routeRoutes = require('./routes/routeRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const customerRoutes = require('./routes/customerRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// =================================================
// MIDDLEWARE STACK
// =================================================

// CORS - Allow cross-origin requests
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging (dev mode)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// =================================================
// API ROUTES
// =================================================

// Authentication routes (signup, login, profile)
app.use('/api/auth', authRoutes);

// Food routes (browse, search, CRUD)
app.use('/api/food', foodRoutes);

// Cart routes (add, update, remove, clear)
app.use('/api/cart', cartRoutes);

// Order routes (place, track, history)
app.use('/api/orders', orderRoutes);

// Admin routes (dashboard, manage users, analytics)
app.use('/api/admin', adminRoutes);

// Route planning routes (TSP algorithms, optimization)
app.use('/api/routes', routeRoutes);

// Delivery agent routes (assigned orders, status updates)
app.use('/api/delivery', deliveryRoutes);

// Customer routes (profile, addresses)
app.use('/api/customer', customerRoutes);

// =================================================
// PAGE ROUTES (Serve HTML pages)
// =================================================

// Landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve any HTML page from /pages/ directory
app.get('/pages/:page', (req, res) => {
    const pagePath = path.join(__dirname, 'public', 'pages', req.params.page);
    res.sendFile(pagePath, (err) => {
        if (err) {
            res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
        }
    });
});

// =================================================
// ERROR HANDLING
// =================================================

// 404 handler for unmatched API routes
app.use('/api/*', notFoundHandler);

// Global error handler (must be last middleware)
app.use(errorHandler);

// =================================================
// SERVER STARTUP
// =================================================

/**
 * Initialize database connection and start the server
 */
async function startServer() {
    try {
        // Test database connection
        const connection = await db.getConnection();
        console.log('✅ MySQL Database connected successfully');
        connection.release();

        // Start listening
        app.listen(PORT, () => {
            console.log(`Server running on ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to connect to database:', error.message);
        console.error('   Make sure MySQL is running and .env is configured correctly.');
        console.error('   Run: mysql -u root -p < database/schema.sql');
        process.exit(1);
    }
}

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err.message);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err.message);
    process.exit(1);
});

module.exports = app;