const { Ingredient, InventoryTransaction, Recipe, Order } = require('../models');
const { NotFoundError } = require('../utils/errors');
const { sequelize } = require('../models');

class InventoryService {
  /**
   * Deduct stock for order
   * Called when order is completed/paid
   */
  async deductStockForOrder(orderId, userId = null) {
    const { OrderItem } = require('../models');
    const order = await Order.findByPk(orderId, {
      include: [{ 
        model: OrderItem, 
        as: 'orderItems',
        attributes: ['id', 'menuItemId', 'quantity']
      }]
    });

    if (!order) {
      throw new NotFoundError('Order');
    }

    if (order.stockDeducted) {
      return { message: 'Stock already deducted for this order' };
    }

    const dbTransaction = await sequelize.transaction();

    try {
      const deductions = [];

      for (const orderItem of order.orderItems) {
        // Get recipe for this menu item
        const recipes = await Recipe.findAll({
          where: { menuItemId: orderItem.menuItemId },
          include: [{ model: Ingredient, as: 'ingredient' }]
        });

        for (const recipe of recipes) {
          // Calculate quantity needed (quantity * orderItem.quantity * waste factor)
          const quantityNeeded = parseFloat(recipe.quantity) * orderItem.quantity * parseFloat(recipe.wasteFactor || 1.0);

          // Get current stock
          const ingredient = await Ingredient.findByPk(recipe.ingredientId, { transaction: dbTransaction });
          if (!ingredient) continue;

          const stockBefore = parseFloat(ingredient.currentStock);
          const stockAfter = stockBefore - quantityNeeded;

          // Update ingredient stock
          await ingredient.update(
            { currentStock: stockAfter },
            { transaction: dbTransaction }
          );

          // Create transaction record
          await InventoryTransaction.create({
            restaurantId: order.restaurantId,
            ingredientId: ingredient.id,
            transactionType: 'order_deduction',
            quantityChange: -quantityNeeded,
            unit: recipe.unit,
            stockBefore,
            stockAfter,
            referenceType: 'order',
            referenceId: orderId,
            notes: `Deducted for order ${order.orderNumber}`,
            createdBy: userId
          }, { transaction: dbTransaction });

          deductions.push({
            ingredient: ingredient.name,
            quantity: quantityNeeded,
            unit: recipe.unit,
            stockAfter
          });
        }
      }

      // Mark order as stock deducted
      await order.update({ stockDeducted: true, stockDeductedAt: new Date() }, { transaction: dbTransaction });

      await dbTransaction.commit();

      return {
        message: 'Stock deducted successfully',
        deductions
      };
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  /**
   * Adjust ingredient stock (manual adjustment)
   */
  async adjustStock(ingredientId, quantityChange, transactionType, notes, userId, restaurantId) {
    const ingredient = await Ingredient.findOne({
      where: { id: ingredientId, restaurantId }
    });

    if (!ingredient) {
      throw new NotFoundError('Ingredient');
    }

    const dbTransaction = await sequelize.transaction();

    try {
      const stockBefore = parseFloat(ingredient.currentStock);
      const stockAfter = stockBefore + parseFloat(quantityChange);

      // Update ingredient stock
      await ingredient.update(
        { currentStock: stockAfter },
        { transaction: dbTransaction }
      );

      // Create transaction record
      const transaction = await InventoryTransaction.create({
        restaurantId,
        ingredientId,
        transactionType,
        quantityChange,
        unit: ingredient.unit,
        stockBefore,
        stockAfter,
        notes,
        createdBy: userId
      }, { transaction: dbTransaction });

      await dbTransaction.commit();

      return {
        transaction,
        ingredient: {
          ...ingredient.toJSON(),
          currentStock: stockAfter
        }
      };
    } catch (error) {
      await dbTransaction.rollback();
      throw error;
    }
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(restaurantId) {
    const ingredients = await Ingredient.findAll({
      where: {
        restaurantId,
        isActive: true
      },
      include: [
        { model: require('../models').IngredientCategory, as: 'ingredientCategory', attributes: ['id', 'name'] }
      ]
    });

    const lowStockItems = ingredients.filter(ingredient => {
      const currentStock = parseFloat(ingredient.currentStock);
      const minimumStock = parseFloat(ingredient.minimumStock || 0);
      return currentStock <= minimumStock && minimumStock > 0;
    });

    return lowStockItems.map(ingredient => ({
      id: ingredient.id,
      name: ingredient.name,
      currentStock: ingredient.currentStock,
      minimumStock: ingredient.minimumStock,
      unit: ingredient.unit,
      category: ingredient.ingredientCategory?.name || ingredient.category,
      isLow: true
    }));
  }

  /**
   * Calculate recipe cost
   */
  async calculateRecipeCost(menuItemId) {
    const recipes = await Recipe.findAll({
      where: { menuItemId },
      include: [{ model: Ingredient, as: 'ingredient' }]
    });

    let totalCost = 0;

    for (const recipe of recipes) {
      const ingredientCost = parseFloat(recipe.ingredient.unitCost || 0);
      const quantity = parseFloat(recipe.quantity);
      const wasteFactor = parseFloat(recipe.wasteFactor || 1.0);
      
      totalCost += ingredientCost * quantity * wasteFactor;
    }

    return {
      totalCost: parseFloat(totalCost.toFixed(2)),
      ingredients: recipes.map(r => ({
        ingredient: r.ingredient.name,
        quantity: r.quantity,
        unit: r.unit,
        unitCost: r.ingredient.unitCost,
        subtotal: (parseFloat(r.ingredient.unitCost || 0) * parseFloat(r.quantity) * parseFloat(r.wasteFactor || 1.0)).toFixed(2)
      }))
    };
  }
}

module.exports = new InventoryService();

