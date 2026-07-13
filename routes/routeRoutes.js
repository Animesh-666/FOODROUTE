/**
 * =================================================
 * Route Planner Routes
 * =================================================
 */

const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { authenticate } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

// Require authentication and admin role for map planning
router.use(authenticate, adminOnly);

router.get('/map-data', routeController.getMapData);
router.post('/optimize', routeController.optimizeRoute);

module.exports = router;
