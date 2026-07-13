/**
 * =================================================
 * Auth Routes
 * =================================================
 * 
 * Defines endpoints for authentication operations.
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateSignup, validateLogin, validateProfileUpdate } = require('../middleware/validator');

// @route   POST /api/auth/signup
// @desc    Register a new customer
// @access  Public
router.post('/signup', validateSignup, authController.signup);

// @route   POST /api/auth/login
// @desc    Login a user (any role)
// @access  Public
router.post('/login', validateLogin, authController.login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private (requires token)
router.get('/profile', authenticate, authController.getProfile);

// @route   PUT /api/auth/profile
// @desc    Update current user profile
// @access  Private (requires token)
router.put('/profile', authenticate, validateProfileUpdate, authController.updateProfile);

module.exports = router;
