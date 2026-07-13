/**
 * =================================================
 * Cart Routes
 * =================================================
 */

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');
const { customerOnly } = require('../middleware/roleCheck');
const { validateCartAdd, validateCartUpdate } = require('../middleware/validator');

// All cart routes require authentication and customer role
router.use(authenticate, customerOnly);

router.get('/', cartController.getCart);
router.post('/', validateCartAdd, cartController.addItem);
router.put('/:id', validateCartUpdate, cartController.updateItem);
router.delete('/:id', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
