/**
 * =================================================
 * Customer Routes
 * =================================================
 */

const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate } = require('../middleware/auth');
const { customerOnly } = require('../middleware/roleCheck');

// Require authentication and customer role
router.use(authenticate, customerOnly);

router.get('/dashboard', customerController.getDashboard);

module.exports = router;
