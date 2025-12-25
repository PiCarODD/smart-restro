const { Ingredient } = require('../models');
const { NotFoundError } = require('../utils/errors');
const inventoryService = require('../services/inventoryService');
const { Op } = require('sequelize');

class IngredientController {
  /**
   * List ingredients
   * GET /api/inventory/ingredients
   */
  async list(req, res, next) {
    try {
      const { categoryId, category, isActive, search } = req.query;
      const where = {
        restaurantId: req.restaurantId // Only from JWT token, never from client
      };

      if (categoryId) {
        where.categoryId = categoryId;
      }
      if (category) {
        where.category = category;
      }
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }
      if (search) {
        where.name = { [Op.iLike]: `%${search}%` };
      }

      const ingredients = await Ingredient.findAll({
        where,
        include: [
          { model: require('../models').Restaurant, as: 'restaurant', attributes: ['id', 'name'] },
          { model: require('../models').IngredientCategory, as: 'ingredientCategory', attributes: ['id', 'name'] }
        ],
        order: [['name', 'ASC']]
      });

      res.json({ ingredients });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ingredient by ID
   * GET /api/inventory/ingredients/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const ingredient = await Ingredient.findOne({
        where: { id, restaurantId: req.restaurantId },
        include: [
          { model: require('../models').IngredientCategory, as: 'ingredientCategory' }
        ]
      });

      if (!ingredient) {
        throw new NotFoundError('Ingredient');
      }

      res.json({ ingredient });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create ingredient
   * POST /api/inventory/ingredients
   */
  async create(req, res, next) {
    try {
      const {
        name,
        sku,
        barcode,
        categoryId,
        category,
        unit,
        unitCost,
        currentStock,
        minimumStock,
        maximumStock,
        reorderQuantity,
        supplierName,
        supplierSku,
        storageLocation,
        storageTemp,
        shelfLifeDays,
        isActive
      } = req.body;

      const ingredient = await Ingredient.create({
        restaurantId: req.restaurantId,
        name,
        sku,
        barcode,
        categoryId,
        category,
        unit,
        unitCost: unitCost || 0,
        currentStock: currentStock || 0,
        minimumStock: minimumStock || 0,
        maximumStock,
        reorderQuantity,
        supplierName,
        supplierSku,
        storageLocation,
        storageTemp,
        shelfLifeDays,
        isActive: isActive !== undefined ? isActive : true
      });

      res.status(201).json({
        message: 'Ingredient created successfully',
        ingredient
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update ingredient
   * PUT /api/inventory/ingredients/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const ingredient = await Ingredient.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!ingredient) {
        throw new NotFoundError('Ingredient');
      }

      await ingredient.update(updateData);

      res.json({
        message: 'Ingredient updated successfully',
        ingredient
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete ingredient
   * DELETE /api/inventory/ingredients/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const ingredient = await Ingredient.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!ingredient) {
        throw new NotFoundError('Ingredient');
      }

      // Check if ingredient is used in recipes
      const { Recipe } = require('../models');
      const recipeCount = await Recipe.count({ where: { ingredientId: id } });

      if (recipeCount > 0) {
        return res.status(400).json({
          error: 'Cannot delete ingredient used in recipes',
          message: `This ingredient is used in ${recipeCount} recipe(s). Please remove it from recipes first.`
        });
      }

      await ingredient.destroy();

      res.json({
        message: 'Ingredient deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adjust stock
   * PUT /api/inventory/ingredients/:id/stock
   */
  async adjustStock(req, res, next) {
    try {
      const { id } = req.params;
      const { quantityChange, transactionType, notes } = req.body;

      const result = await inventoryService.adjustStock(
        id,
        quantityChange,
        transactionType || 'manual_adjustment',
        notes,
        req.user.id,
        req.restaurantId
      );

      res.json({
        message: 'Stock adjusted successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IngredientController();

