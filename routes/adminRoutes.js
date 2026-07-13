/**
 * =================================================
 * Admin Routes
 * =================================================
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const { validateId } = require('../middleware/validator');

// All admin routes require authentication and admin role
router.use(authenticate, adminOnly);

// Dashboard & Analytics
router.get('/dashboard', adminController.getDashboardStats);
router.get('/analytics/daily', adminController.getDailyAnalytics);

// User Management
router.get('/users', adminController.getUsers);
router.put('/users/:id/toggle-status', validateId, adminController.toggleUserStatus);
router.delete('/users/:id', validateId, adminController.deleteUser);

// Agent Management
router.get('/agents', adminController.getAgents);
router.get('/agents/:id/route', validateId, adminController.getAgentRoute);
router.post('/agents', adminController.registerAgent);

module.exports = router;
