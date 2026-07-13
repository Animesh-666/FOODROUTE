/**
 * =================================================
 * Food Controller
 * =================================================
 * 
 * Handles food menu browsing and management.
 */

const Food = require('../models/foodModel');
const { buildPaginationMeta, paginate } = require('../utils/helpers');

/**
 * Get all food items (Public - with search, filter, pagination)
 * GET /api/food
 */
const getAll = async (req, res, next) => {
    try {
        const { page, limit, category, search, is_veg, sort_by, sort_order } = req.query;
        
        const pagination = paginate(page, limit);
        
        const { items, total } = await Food.findAll({
            page: pagination.page,
            limit: pagination.limit,
            category,
            search,
            is_veg,
            sort_by,
            sort_order
        });
        
        res.json({
            success: true,
            data: items,
            meta: buildPaginationMeta(total, pagination.page, pagination.limit)
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single food item by ID (Public)
 * GET /api/food/:id
 */
const getById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const food = await Food.findById(id);
        
        if (!food) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found',
                code: 'NOT_FOUND'
            });
        }
        
        res.json({
            success: true,
            data: food
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all categories (Public)
 * GET /api/food/categories/list
 */
const getCategories = async (req, res, next) => {
    try {
        const categories = await Food.getCategories();
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create food item (Admin)
 * POST /api/food
 */
const create = async (req, res, next) => {
    try {
        const insertId = await Food.create(req.body);
        
        res.status(201).json({
            success: true,
            message: 'Food item created successfully',
            data: { id: insertId, ...req.body }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update food item (Admin)
 * PUT /api/food/:id
 */
const update = async (req, res, next) => {
    try {
        const id = req.params.id;
        const success = await Food.update(id, req.body);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found or no changes made'
            });
        }
        
        res.json({
            success: true,
            message: 'Food item updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete food item (Admin)
 * DELETE /api/food/:id
 */
const remove = async (req, res, next) => {
    try {
        const id = req.params.id;
        const success = await Food.delete(id);
        
        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Food item deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getById,
    getCategories,
    create,
    update,
    remove
};
