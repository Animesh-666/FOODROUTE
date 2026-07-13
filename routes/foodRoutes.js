/**
 * =================================================
 * Food Routes
 * =================================================
 */

const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const { authenticate } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const { validateFood } = require('../middleware/validator');

// Public routes
router.get('/', foodController.getAll);
router.get('/categories/list', foodController.getCategories);
router.get('/:id', foodController.getById);

// Admin only routes
router.post('/', authenticate, adminOnly, validateFood, foodController.create);
router.put('/:id', authenticate, adminOnly, validateFood, foodController.update);
router.delete('/:id', authenticate, adminOnly, foodController.remove);

module.exports = router;
