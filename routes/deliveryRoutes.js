/**
 * =================================================
 * Delivery Agent Routes
 * =================================================
 */

const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { authenticate } = require('../middleware/auth');
const { deliveryAgentOnly } = require('../middleware/roleCheck');

// Require authentication and delivery agent role
router.use(authenticate, deliveryAgentOnly);

router.get('/dashboard', deliveryController.getDashboard);
router.put('/availability', deliveryController.updateAvailability);
router.put('/location', deliveryController.updateLocation);
router.put('/orders/:id/deliver', deliveryController.markDelivered);

module.exports = router;
