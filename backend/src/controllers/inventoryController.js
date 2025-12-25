const { InventoryTransaction, Ingredient } = require('../models');
const inventoryService = require('../services/inventoryService');
const { Op } = require('sequelize');

class InventoryController {
  /**
   * Get low stock alerts
   * GET /api/inventory/low-stock
   */
  async getLowStock(req, res, next) {
    try {
      // restaurantId removed from query - only from JWT token for security
      const alerts = await inventoryService.getLowStockAlerts(req.restaurantId);

      res.json({
        alerts,
        count: alerts.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record stock take
   * POST /api/inventory/stock-take
   */
  async stockTake(req, res, next) {
    try {
      const { items } = req.body; // Array of { ingredientId, countedStock }

      const { sequelize } = require('../models');
      const dbTransaction = await sequelize.transaction();

      try {
        const results = [];

        for (const item of items) {
          const ingredient = await Ingredient.findOne({
            where: { id: item.ingredientId, restaurantId: req.restaurantId }
          });

          if (!ingredient) continue;

          const stockBefore = parseFloat(ingredient.currentStock);
          const countedStock = parseFloat(item.countedStock);
          const quantityChange = countedStock - stockBefore;

          if (quantityChange !== 0) {
            // Update stock
            await ingredient.update(
              { currentStock: countedStock },
              { transaction: dbTransaction }
            );

            // Create transaction
            await InventoryTransaction.create({
              restaurantId: req.restaurantId,
              ingredientId: ingredient.id,
              transactionType: 'stock_take',
              quantityChange,
              unit: ingredient.unit,
              stockBefore,
              stockAfter: countedStock,
              notes: item.notes || 'Stock take adjustment',
              createdBy: req.user.id
            }, { transaction: dbTransaction });

            results.push({
              ingredientId: ingredient.id,
              ingredientName: ingredient.name,
              stockBefore,
              stockAfter: countedStock,
              difference: quantityChange
            });
          }
        }

        await dbTransaction.commit();

        res.json({
          message: 'Stock take recorded successfully',
          results
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
   * Get transaction history
   * GET /api/inventory/transactions
   */
  async getTransactions(req, res, next) {
    try {
      const { ingredientId, transactionType, startDate, endDate, page = 1, limit = 50 } = req.query;

      const where = {
        restaurantId: req.restaurantId // Only from JWT token, never from client
      };

      if (ingredientId) {
        where.ingredientId = ingredientId;
      }
      if (transactionType) {
        where.transactionType = transactionType;
      }
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt[Op.gte] = new Date(startDate);
        if (endDate) where.createdAt[Op.lte] = new Date(endDate);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: transactions } = await InventoryTransaction.findAndCountAll({
        where,
        include: [
          { model: Ingredient, as: 'ingredient', attributes: ['id', 'name', 'unit'] },
          { model: require('../models').User, as: 'createdByUser', attributes: ['id', 'firstName', 'lastName'] }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryController();

