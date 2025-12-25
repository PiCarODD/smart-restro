const { IngredientCategory } = require('../models');
const { NotFoundError } = require('../utils/errors');

class IngredientCategoryController {
  /**
   * List ingredient categories
   * GET /api/inventory/categories
   */
  async list(req, res, next) {
    try {
      const where = {
        restaurantId: req.restaurantId // Only from JWT token, never from client
      };

      const categories = await IngredientCategory.findAll({
        where,
        include: [
          { model: require('../models').Restaurant, as: 'restaurant', attributes: ['id', 'name'] },
          { model: require('../models').Ingredient, as: 'ingredients', attributes: ['id', 'name'] }
        ],
        order: [['display_order', 'ASC'], ['created_at', 'ASC']]
      });

      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category by ID
   * GET /api/inventory/categories/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await IngredientCategory.findOne({
        where: { id, restaurantId: req.restaurantId },
        include: [
          { model: require('../models').Ingredient, as: 'ingredients' }
        ]
      });

      if (!category) {
        throw new NotFoundError('Ingredient category');
      }

      res.json({ category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create category
   * POST /api/inventory/categories
   */
  async create(req, res, next) {
    try {
      const { name, description, displayOrder } = req.body;

      const category = await IngredientCategory.create({
        restaurantId: req.restaurantId,
        name,
        description,
        displayOrder: displayOrder || 0
      });

      res.status(201).json({
        message: 'Ingredient category created successfully',
        category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update category
   * PUT /api/inventory/categories/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, displayOrder } = req.body;

      const category = await IngredientCategory.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!category) {
        throw new NotFoundError('Ingredient category');
      }

      await category.update({ name, description, displayOrder });

      res.json({
        message: 'Ingredient category updated successfully',
        category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete category
   * DELETE /api/inventory/categories/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const category = await IngredientCategory.findOne({
        where: { id, restaurantId: req.restaurantId },
        include: [{ model: require('../models').Ingredient, as: 'ingredients' }]
      });

      if (!category) {
        throw new NotFoundError('Ingredient category');
      }

      // Check if category has ingredients
      if (category.ingredients && category.ingredients.length > 0) {
        return res.status(400).json({
          error: 'Cannot delete category with ingredients',
          message: 'Please move or delete all ingredients in this category first'
        });
      }

      await category.destroy();

      res.json({
        message: 'Ingredient category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IngredientCategoryController();

