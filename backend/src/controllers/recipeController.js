const { Recipe, MenuItem, Ingredient } = require('../models');
const { NotFoundError } = require('../utils/errors');
const inventoryService = require('../services/inventoryService');

class RecipeController {
  /**
   * Get recipe for menu item
   * GET /api/recipes/:menuItemId
   */
  async getRecipe(req, res, next) {
    try {
      const { menuItemId } = req.params;

      const menuItem = await MenuItem.findOne({
        where: { id: menuItemId, restaurantId: req.restaurantId }
      });

      if (!menuItem) {
        throw new NotFoundError('Menu item');
      }

      const recipes = await Recipe.findAll({
        where: { menuItemId },
        include: [
          { model: Ingredient, as: 'ingredient' }
        ],
        order: [['created_at', 'ASC']]
      });

      res.json({
        menuItemId,
        recipe: recipes.map(r => ({
          id: r.id,
          ingredientId: r.ingredientId,
          ingredient: {
            id: r.ingredient.id,
            name: r.ingredient.name,
            unit: r.ingredient.unit,
            unitCost: r.ingredient.unitCost
          },
          quantity: r.quantity,
          unit: r.unit,
          variantName: r.variantName,
          wasteFactor: r.wasteFactor,
          notes: r.notes
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update recipe for menu item
   * PUT /api/recipes/:menuItemId
   */
  async updateRecipe(req, res, next) {
    try {
      const { menuItemId } = req.params;
      const { ingredients } = req.body; // Array of { ingredientId, quantity, unit, variantName, wasteFactor, notes }

      const menuItem = await MenuItem.findOne({
        where: { id: menuItemId, restaurantId: req.restaurantId }
      });

      if (!menuItem) {
        throw new NotFoundError('Menu item');
      }

      const { sequelize } = require('../models');
      const dbTransaction = await sequelize.transaction();

      try {
        // Delete existing recipes
        await Recipe.destroy({
          where: { menuItemId },
          transaction: dbTransaction
        });

        // Create new recipes
        if (ingredients && Array.isArray(ingredients)) {
          for (const ingredient of ingredients) {
            await Recipe.create({
              menuItemId,
              ingredientId: ingredient.ingredientId,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              variantName: ingredient.variantName || null,
              wasteFactor: ingredient.wasteFactor || 1.0,
              notes: ingredient.notes || null
            }, { transaction: dbTransaction });
          }
        }

        await dbTransaction.commit();

        // Get updated recipe
        const recipes = await Recipe.findAll({
          where: { menuItemId },
          include: [{ model: Ingredient, as: 'ingredient' }]
        });

        res.json({
          message: 'Recipe updated successfully',
          menuItemId,
          recipe: recipes
        });
      } catch (error) {
        await dbTransaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete recipe for menu item
   * DELETE /api/recipes/:menuItemId
   */
  async deleteRecipe(req, res, next) {
    try {
      const { menuItemId } = req.params;

      const menuItem = await MenuItem.findOne({
        where: { id: menuItemId, restaurantId: req.restaurantId }
      });

      if (!menuItem) {
        throw new NotFoundError('Menu item');
      }

      await Recipe.destroy({ where: { menuItemId } });

      res.json({
        message: 'Recipe deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate recipe cost
   * GET /api/recipes/:menuItemId/cost
   */
  async calculateCost(req, res, next) {
    try {
      const { menuItemId } = req.params;

      const menuItem = await MenuItem.findOne({
        where: { id: menuItemId, restaurantId: req.restaurantId }
      });

      if (!menuItem) {
        throw new NotFoundError('Menu item');
      }

      const costAnalysis = await inventoryService.calculateRecipeCost(menuItemId);

      res.json({
        menuItemId,
        basePrice: menuItem.basePrice,
        ...costAnalysis,
        foodCostPercentage: menuItem.basePrice > 0 
          ? ((costAnalysis.totalCost / parseFloat(menuItem.basePrice)) * 100).toFixed(2)
          : 0,
        grossProfit: menuItem.basePrice > 0
          ? (parseFloat(menuItem.basePrice) - costAnalysis.totalCost).toFixed(2)
          : 0
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RecipeController();

