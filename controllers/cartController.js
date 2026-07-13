/**
 * =================================================
 * Cart Controller
 * =================================================
 * 
 * Handles shopping cart operations for customers.
 */

const Cart = require('../models/cartModel');
const Food = require('../models/foodModel');

/**
 * Get user's cart
 * GET /api/cart
 */
const getCart = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        const items = await Cart.getCart(userId);
        const subtotal = await Cart.getCartTotal(userId);
        
        res.json({
            success: true,
            data: {
                items,
                summary: {
                    subtotal,
                    item_count: items.length
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add item to cart
 * POST /api/cart
 */
const addItem = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { food_id, quantity = 1 } = req.body;
        
        // Validate food item exists and is available
        const food = await Food.findById(food_id);
        
        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found'
            });
        }
        
        if (!food.is_available) {
            return res.status(400).json({
                success: false,
                message: 'This item is currently unavailable'
            });
        }
        
        const cartId = await Cart.addItem(userId, food_id, quantity);
        
        // Get updated cart count
        const count = await Cart.getCartCount(userId);
        
        res.status(201).json({
            success: true,
            message: 'Item added to cart',
            cart_id: cartId,
            cart_count: count
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update cart item quantity
 * PUT /api/cart/:id
 */
const updateItem = async (req, res, next) => {
    try {
        const cartId = req.params.id;
        const { quantity } = req.body;
        
        const success = await Cart.updateQuantity(cartId, quantity);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }
        
        // Get updated subtotal
        const subtotal = await Cart.getCartTotal(req.user.id);
        
        res.json({
            success: true,
            message: 'Cart updated',
            subtotal
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove item from cart
 * DELETE /api/cart/:id
 */
const removeItem = async (req, res, next) => {
    try {
        const cartId = req.params.id;
        const userId = req.user.id;
        
        const success = await Cart.removeItem(cartId, userId);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }
        
        const subtotal = await Cart.getCartTotal(userId);
        const count = await Cart.getCartCount(userId);
        
        res.json({
            success: true,
            message: 'Item removed from cart',
            subtotal,
            cart_count: count
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Clear user's cart
 * DELETE /api/cart
 */
const clearCart = async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        await Cart.clearCart(userId);
        
        res.json({
            success: true,
            message: 'Cart cleared completely'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCart,
    addItem,
    updateItem,
    removeItem,
    clearCart
};
