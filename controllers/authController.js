/**
 * =================================================
 * Auth Controller
 * =================================================
 * 
 * Handles user authentication: signup, login, profile.
 */

const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/helpers');

/**
 * Register a new customer
 * POST /api/auth/signup
 */
const signup = async (req, res, next) => {
    try {
        const { name, email, password, phone, address } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.',
                code: 'EMAIL_EXISTS'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user (role defaults to 'customer' if not provided)
        const insertId = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            role: req.body.role || 'customer'
        });

        // Generate token
        const user = { id: insertId, name, email, role: 'customer' };
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Login user (handles all roles)
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const userRecord = await User.findByEmail(email);
        
        if (!userRecord) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Check if account is active
        if (!userRecord.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.',
                code: 'ACCOUNT_INACTIVE'
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, userRecord.password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Generate token
        const user = {
            id: userRecord.id,
            name: userRecord.name,
            email: userRecord.email,
            role: userRecord.role
        };
        
        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
const getProfile = async (req, res, next) => {
    try {
        // req.user is set by authenticate middleware
        const userId = req.user.id;
        
        const userProfile = await User.findById(userId);
        
        if (!userProfile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found',
                code: 'USER_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: userProfile
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Update current user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, phone, address, latitude, longitude } = req.body;

        const success = await User.updateProfile(userId, {
            name, phone, address, latitude, longitude
        });

        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'No changes made to profile'
            });
        }

        // Fetch updated profile to return
        const updatedProfile = await User.findById(userId);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedProfile
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    signup,
    login,
    getProfile,
    updateProfile
};
