const { Order, OrderItem, MenuItem, MenuCategory, User, Payment, Ingredient, Recipe } = require('../models');
const { Op, fn, col, literal, Sequelize } = require('sequelize');

class ReportService {
  /**
   * Get daily sales report
   */
  async getDailySales(restaurantId, startDate, endDate) {
    const where = {
      restaurantId,
      status: { [Op.in]: ['completed', 'served'] },
      completedAt: {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      }
    };

    const orders = await Order.findAll({
      where,
      attributes: [
        [fn('DATE', col('completed_at')), 'date'],
        [fn('SUM', col('subtotal')), 'revenue'],
        [fn('SUM', col('tax_amount')), 'tax'],
        [fn('SUM', col('discount_amount')), 'discount'],
        [fn('SUM', col('tip_amount')), 'tips'],
        [fn('SUM', col('total_amount')), 'total'],
        [fn('COUNT', col('id')), 'orders']
      ],
      group: [fn('DATE', col('completed_at'))],
      order: [[fn('DATE', col('completed_at')), 'ASC']],
      raw: true
    });

    return orders.map(order => ({
      date: order.date,
      dayName: new Date(order.date).toLocaleDateString('en-US', { weekday: 'short' }),
      dayShort: new Date(order.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
      revenue: parseFloat(order.revenue || 0),
      orders: parseInt(order.orders || 0),
      avgOrder: order.orders > 0 ? parseFloat((order.revenue / order.orders).toFixed(2)) : 0,
      tips: parseFloat(order.tips || 0),
      tax: parseFloat(order.tax || 0),
      discount: parseFloat(order.discount || 0),
      total: parseFloat(order.total || 0)
    }));
  }

  /**
   * Get hourly sales report
   */
  async getHourlySales(restaurantId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where = {
      restaurantId,
      status: { [Op.in]: ['completed', 'served'] },
      completedAt: {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay
      }
    };

    const orders = await Order.findAll({
      where,
      attributes: [
        [fn('EXTRACT', literal('HOUR FROM completed_at')), 'hour'],
        [fn('SUM', col('total_amount')), 'sales'],
        [fn('COUNT', col('id')), 'orders']
      ],
      group: [fn('EXTRACT', literal('HOUR FROM completed_at'))],
      order: [[fn('EXTRACT', literal('HOUR FROM completed_at')), 'ASC']],
      raw: true
    });

    // Fill in missing hours with 0
    const hoursMap = {};
    orders.forEach(order => {
      hoursMap[parseInt(order.hour)] = {
        hour: `${parseInt(order.hour)}:00`,
        sales: parseFloat(order.sales || 0),
        orders: parseInt(order.orders || 0)
      };
    });

    const result = [];
    for (let h = 0; h < 24; h++) {
      result.push(hoursMap[h] || {
        hour: `${h}:00`,
        sales: 0,
        orders: 0
      });
    }

    return result;
  }

  /**
   * Get sales by category
   */
  async getSalesByCategory(restaurantId, startDate, endDate) {
    const where = {
      restaurantId,
      status: { [Op.in]: ['completed', 'served'] },
      completedAt: {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      }
    };

    const orderItems = await OrderItem.findAll({
      include: [
        {
          model: Order,
          as: 'order',
          where,
          attributes: []
        },
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: [],
          include: [
            {
              model: MenuCategory,
              as: 'category',
              attributes: ['id', 'name', 'color']
            }
          ]
        }
      ],
      attributes: [
        [fn('SUM', col('total_price')), 'revenue'],
        [fn('SUM', col('quantity')), 'quantity'],
        [fn('COUNT', col('OrderItem.id')), 'orders']
      ],
      group: ['menuItem.category.id', 'menuItem.category.name', 'menuItem.category.color'],
      raw: false
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    let colorIndex = 0;

    return orderItems.map(item => {
      const category = item.menuItem?.category;
      if (!category) return null;

      const color = category.color || colors[colorIndex % colors.length];
      colorIndex++;

      return {
        id: category.id,
        name: category.name,
        value: parseFloat(item.get('revenue') || 0),
        color,
        orders: parseInt(item.get('orders') || 0),
        quantity: parseInt(item.get('quantity') || 0)
      };
    }).filter(Boolean);
  }

  /**
   * Get top selling items
   */
  async getTopSellingItems(restaurantId, startDate, endDate, limit = 10) {
    const where = {
      restaurantId,
      status: { [Op.in]: ['completed', 'served'] },
      completedAt: {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      }
    };

    const orderItems = await OrderItem.findAll({
      include: [
        {
          model: Order,
          as: 'order',
          where,
          attributes: []
        },
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id', 'name'],
          include: [
        {
          model: MenuCategory,
          as: 'category',
          attributes: ['id', 'name']
        }
          ]
        }
      ],
      attributes: [
        [fn('SUM', col('quantity')), 'quantity'],
        [fn('SUM', col('total_price')), 'revenue']
      ],
      group: ['menuItem.id', 'menuItem.name', 'menuItem.category.id', 'menuItem.category.name'],
      order: [[fn('SUM', col('total_price')), 'DESC']],
      limit,
      raw: false
    });

    // Calculate trend (simplified - compare with previous period)
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - daysDiff);
    const previousEndDate = new Date(startDate);

    return Promise.all(orderItems.map(async (item) => {
      const menuItem = item.menuItem;
      if (!menuItem) return null;

      // Get previous period data for trend calculation
      const previousItems = await OrderItem.findAll({
        include: [
          {
            model: Order,
            as: 'order',
            where: {
              restaurantId,
              status: { [Op.in]: ['completed', 'served'] },
              completedAt: {
                [Op.gte]: previousStartDate,
                [Op.lt]: previousEndDate
              }
            },
            attributes: []
          },
          {
            model: MenuItem,
            as: 'menuItem',
            where: { id: menuItem.id },
            attributes: []
          }
        ],
        attributes: [
          [fn('SUM', col('total_price')), 'revenue']
        ],
        raw: true
      });

      const currentRevenue = parseFloat(item.get('revenue') || 0);
      const previousRevenue = parseFloat(previousItems[0]?.revenue || 0);
      const trend = previousRevenue > 0 
        ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
        : 0;

      return {
        id: menuItem.id,
        name: menuItem.name,
        category: menuItem.category?.name || 'Uncategorized',
        quantity: parseInt(item.get('quantity') || 0),
        revenue: currentRevenue,
        trend
      };
    }));
  }

  /**
   * Get staff performance
   */
  async getStaffPerformance(restaurantId, startDate, endDate) {
    const where = {
      restaurantId,
      status: { [Op.in]: ['completed', 'served'] },
      completedAt: {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      },
      waiterId: { [Op.ne]: null }
    };

    const staffStats = await Order.findAll({
      where,
      include: [
        {
          model: User,
          as: 'waiter',
          attributes: ['id', 'firstName', 'lastName', 'role']
        }
      ],
      attributes: [
        'waiterId',
        [fn('COUNT', col('Order.id')), 'orders'],
        [fn('SUM', col('total_amount')), 'revenue'],
        [fn('SUM', col('tip_amount')), 'tips'],
        [fn('AVG', literal("EXTRACT(EPOCH FROM (completed_at - placed_at)) / 60")), 'avgTime']
      ],
      group: [
        'waiterId', 
        literal('"waiter"."id"'),
        literal('"waiter"."first_name"'), 
        literal('"waiter"."last_name"'), 
        literal('"waiter"."role"')
      ],
      raw: false
    });

    return staffStats.map(stat => {
      const waiter = stat.waiter;
      if (!waiter) return null;

      return {
        id: waiter.id,
        name: `${waiter.firstName} ${waiter.lastName}`,
        role: waiter.role || 'Server',
        orders: parseInt(stat.get('orders') || 0),
        revenue: parseFloat(stat.get('revenue') || 0),
        tips: parseFloat(stat.get('tips') || 0),
        avgTime: Math.round(parseFloat(stat.get('avgTime') || 0)),
        rating: 4.5 // Placeholder - would need rating system
      };
    }).filter(Boolean);
  }

  /**
   * Get payment methods breakdown
   */
  async getPaymentMethods(restaurantId, startDate, endDate) {
    const where = {
      restaurantId,
      status: 'completed',
      completedAt: {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      }
    };

    // Get orders with payment info
    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Payment,
          as: 'payments',
          attributes: ['paymentMethod', 'amount'],
          required: false
        }
      ],
      attributes: ['id', 'totalAmount']
    });

    // Aggregate by payment method
    const methodMap = {};
    let totalAmount = 0;

    orders.forEach(order => {
      if (order.payments && order.payments.length > 0) {
        order.payments.forEach(payment => {
          const method = payment.paymentMethod || 'Cash';
          if (!methodMap[method]) {
            methodMap[method] = { method, amount: 0, count: 0 };
          }
          methodMap[method].amount += parseFloat(payment.amount || 0);
          methodMap[method].count += 1;
          totalAmount += parseFloat(payment.amount || 0);
        });
      } else {
        // Fallback to Cash if no payment record
        const method = 'Cash';
        if (!methodMap[method]) {
          methodMap[method] = { method, amount: 0, count: 0 };
        }
        methodMap[method].amount += parseFloat(order.totalAmount || 0);
        methodMap[method].count += 1;
        totalAmount += parseFloat(order.totalAmount || 0);
      }
    });

    return Object.values(methodMap).map(method => ({
      method: method.method,
      amount: parseFloat(method.amount.toFixed(2)),
      percentage: totalAmount > 0 ? Math.round((method.amount / totalAmount) * 100) : 0,
      count: method.count
    }));
  }

  /**
   * Get inventory usage report
   */
  async getInventoryUsage(restaurantId, startDate, endDate) {
    const where = {
      restaurantId,
      status: { [Op.in]: ['completed', 'served'] },
      completedAt: {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      }
    };

    // Get all order items in the period
    const orderItems = await OrderItem.findAll({
      include: [
        {
          model: Order,
          as: 'order',
          where,
          attributes: []
        },
        {
          model: MenuItem,
          as: 'menuItem',
          attributes: ['id']
        }
      ],
      attributes: ['menuItemId', 'quantity']
    });

    // Get recipes for all menu items
    const menuItemIds = [...new Set(orderItems.map(item => item.menuItemId))];
    
    // Get menu items to filter by restaurant
    const menuItems = await MenuItem.findAll({
      where: {
        id: { [Op.in]: menuItemIds },
        restaurantId
      },
      attributes: ['id']
    });
    
    const validMenuItemIds = menuItems.map(m => m.id);
    
    const recipes = await Recipe.findAll({
      where: {
        menuItemId: { [Op.in]: validMenuItemIds }
      },
      include: [
        {
          model: Ingredient,
          as: 'ingredient',
          where: { restaurantId },
          attributes: ['id', 'name', 'unit', 'currentStock', 'minimumStock', 'unitCost'],
          required: true
        }
      ]
    });

    // Calculate ingredient usage
    const ingredientUsage = {};

    orderItems.forEach(orderItem => {
      const itemRecipes = recipes.filter(r => r.menuItemId === orderItem.menuItemId);
      if (!itemRecipes || itemRecipes.length === 0) return;

      itemRecipes.forEach(recipe => {
        const ingredient = recipe.ingredient;
        if (!ingredient) return;

        const usage = parseFloat(recipe.quantity || 0) * orderItem.quantity;
        const cost = usage * parseFloat(ingredient.unitCost || 0);

        if (!ingredientUsage[ingredient.id]) {
          ingredientUsage[ingredient.id] = {
            id: ingredient.id,
            name: ingredient.name,
            unit: ingredient.unit,
            used: 0,
            cost: 0,
            currentStock: parseFloat(ingredient.currentStock || 0),
            minimumStock: parseFloat(ingredient.minimumStock || 0)
          };
        }

        ingredientUsage[ingredient.id].used += usage;
        ingredientUsage[ingredient.id].cost += cost;
      });
    });

    return Object.values(ingredientUsage).map(ingredient => ({
      id: ingredient.id,
      name: ingredient.name,
      used: parseFloat(ingredient.used.toFixed(2)),
      unit: ingredient.unit,
      cost: parseFloat(ingredient.cost.toFixed(2)),
      reorderNeeded: ingredient.currentStock <= ingredient.minimumStock
    }));
  }

  /**
   * Get summary statistics
   */
  async getSummaryStats(restaurantId, startDate, endDate) {
    const where = {
      restaurantId,
      status: { [Op.in]: ['completed', 'served'] },
      completedAt: {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      }
    };

    const stats = await Order.findOne({
      where,
      attributes: [
        [fn('SUM', col('subtotal')), 'revenue'],
        [fn('SUM', col('tax_amount')), 'tax'],
        [fn('SUM', col('discount_amount')), 'discount'],
        [fn('SUM', col('tip_amount')), 'tips'],
        [fn('SUM', col('total_amount')), 'total'],
        [fn('COUNT', col('id')), 'orders']
      ],
      raw: true
    });

    const revenue = parseFloat(stats.revenue || 0);
    const orders = parseInt(stats.orders || 0);

    return {
      revenue,
      orders,
      avgOrder: orders > 0 ? parseFloat((revenue / orders).toFixed(2)) : 0,
      tips: parseFloat(stats.tips || 0),
      tax: parseFloat(stats.tax || 0),
      discount: parseFloat(stats.discount || 0),
      total: parseFloat(stats.total || 0)
    };
  }
}

module.exports = new ReportService();

