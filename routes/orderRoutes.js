/**
 * =================================================
 * Order Routes
 * =================================================
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { customerOnly, adminOnly, adminOrAgent } = require('../middleware/roleCheck');
const { validateOrder, validateOrderStatus } = require('../middleware/validator');

// All order routes require authentication
router.use(authenticate);

// Customer routes
router.post('/', customerOnly, validateOrder, orderController.placeOrder);
router.get('/my-orders', customerOnly, orderController.getMyOrders);

// Admin routes
router.get('/all', adminOnly, orderController.getAllOrders);
router.put('/:id/assign', adminOnly, orderController.assignAgent);

// Shared/Mixed access routes (Admin or Agent)
router.put('/:id/status', adminOrAgent, validateOrderStatus, orderController.updateStatus);

// Order details (Access control is handled inside the controller)
router.get('/:id', orderController.getOrderDetails);

module.exports = router;
