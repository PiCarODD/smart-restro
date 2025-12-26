const { Order, OrderItem, Table, MenuItem, MenuCategory, Notification } = require('../models');
const { NotFoundError } = require('../utils/errors');
const { Op } = require('sequelize');

class KDSController {
  /**
   * Get active orders for KDS
   * GET /api/kds/orders
   */
  async getOrders(req, res, next) {
    try {
      const { station, status } = req.query;

      const where = {
        restaurantId: req.restaurantId, // Only from JWT token
        status: {
          [Op.in]: ['confirmed', 'preparing', 'ready']
        }
      };

      if (status) {
        where.status = status;
      }

      const orders = await Order.findAll({
        where,
        include: [
          {
            model: Table,
            as: 'table',
            attributes: ['id', 'tableNumber', 'name']
          },
          {
            model: require('../models').User,
            as: 'waiter',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: OrderItem,
            as: 'orderItems',
            include: [
              {
                model: MenuItem,
                as: 'menuItem',
                attributes: ['id', 'name', 'kdsStation'],
                include: [
                  {
                    model: MenuCategory,
                    as: 'category',
                    attributes: ['id', 'name', 'kdsStation'],
                    required: false
                  }
                ],
                required: false
              }
            ],
            required: false
          }
        ],
        order: [
          ['placed_at', 'ASC'], // Oldest first
          [{ model: OrderItem, as: 'orderItems' }, 'course', 'ASC'],
          [{ model: OrderItem, as: 'orderItems' }, 'created_at', 'ASC']
        ]
      });

      // Filter orders that have items for the specified station
      let filteredOrders = orders;
      if (station) {
        filteredOrders = orders.filter(order => {
          if (!order.orderItems || order.orderItems.length === 0) return false;
          // Check if any item matches the station
          return order.orderItems.some(item => {
            const itemStation = item.kdsStation || 
                              (item.menuItem && item.menuItem.kdsStation) ||
                              (item.menuItem && item.menuItem.category && item.menuItem.category.kdsStation);
            return itemStation === station;
          });
        });
      }

      res.json({
        orders: filteredOrders
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update item status (KDS)
   * PUT /api/kds/items/:id/status
   */
  async updateItemStatus(req, res, next) {
    try {
      const { id: itemId } = req.params;
      const { status } = req.body;

      const orderItem = await OrderItem.findOne({
        where: { id: itemId },
        include: [
          {
            model: Order,
            as: 'order',
            where: { restaurantId: req.restaurantId }
          }
        ]
      });

      if (!orderItem) {
        throw new NotFoundError('Order item');
      }

      const statusUpdates = { status };

      if (status === 'preparing') {
        statusUpdates.startedAt = new Date();
      } else if (status === 'ready') {
        statusUpdates.readyAt = new Date();
      }

      await orderItem.update(statusUpdates);

      // Check if all items are ready, update order status
      const allItems = await OrderItem.findAll({ 
        where: { orderId: orderItem.orderId } 
      });
      const allReady = allItems.every(item => 
        ['ready', 'served', 'cancelled'].includes(item.status)
      );

      if (allReady && orderItem.order.status === 'preparing') {
        await orderItem.order.update({ 
          status: 'ready', 
          readyAt: new Date() 
        });

        // Create notification for waiter
        if (orderItem.order.waiterId) {
          await Notification.create({
            restaurantId: req.restaurantId,
            userId: orderItem.order.waiterId,
            type: 'order_ready',
            title: `Order ${orderItem.order.orderNumber} Ready`,
            message: `Table ${orderItem.order.table?.tableNumber || orderItem.order.tableId} order is ready for pickup`,
            data: {
              orderId: orderItem.orderId,
              tableId: orderItem.order.tableId,
              orderNumber: orderItem.order.orderNumber,
              tableName: orderItem.order.table?.name || `Table ${orderItem.order.table?.tableNumber}`
            }
          });
        }

        // Emit order ready event to waiter
        if (req.app.get('io')) {
          req.app.get('io').to(`waiter:${orderItem.order.waiterId}`).emit('order:ready', {
            orderId: orderItem.orderId,
            tableId: orderItem.order.tableId,
            orderNumber: orderItem.order.orderNumber,
            tableName: orderItem.order.table?.name || `Table ${orderItem.order.table?.tableNumber}`
          });
        }
      }

      // Emit item status change event to KDS
      if (req.app.get('io')) {
        req.app.get('io').to(`kds:${req.restaurantId}`).emit('order:item_updated', {
          orderId: orderItem.orderId,
          itemId,
          status,
          orderItem: {
            id: orderItem.id,
            itemName: orderItem.itemName,
            status: orderItem.status,
            startedAt: orderItem.startedAt,
            readyAt: orderItem.readyAt
          }
        });
      }

      res.json({
        message: 'Order item status updated successfully',
        orderItem
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bump order (mark as served/completed)
   * POST /api/kds/orders/:id/bump
   */
  async bumpOrder(req, res, next) {
    try {
      const { id: orderId } = req.params;

      const order = await Order.findOne({
        where: { id: orderId, restaurantId: req.restaurantId },
        include: [
          {
            model: OrderItem,
            as: 'orderItems'
          }
        ]
      });

      if (!order) {
        throw new NotFoundError('Order');
      }

      // Mark all items as served
      await OrderItem.update(
        { status: 'served' },
        { where: { orderId, status: { [Op.ne]: 'cancelled' } } }
      );

      // Update order status to served
      await order.update({ 
        status: 'served',
        servedAt: new Date()
      });

      // Emit order served event
      if (req.app.get('io')) {
        req.app.get('io').to(`kds:${req.restaurantId}`).emit('order:served', {
          orderId,
          orderNumber: order.orderNumber
        });
      }

      res.json({
        message: 'Order bumped successfully',
        order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get KDS history (recent completed orders)
   * GET /api/kds/history
   */
  async getHistory(req, res, next) {
    try {
      const { limit = 20 } = req.query;

      const orders = await Order.findAll({
        where: {
          restaurantId: req.restaurantId,
          status: {
            [Op.in]: ['served', 'completed']
          }
        },
        include: [
          {
            model: Table,
            as: 'table',
            attributes: ['id', 'tableNumber', 'name']
          },
          {
            model: OrderItem,
            as: 'orderItems',
            attributes: ['id', 'itemName', 'quantity', 'status']
          }
        ],
        order: [['served_at', 'DESC'], ['completed_at', 'DESC']],
        limit: parseInt(limit)
      });

      res.json({
        orders
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get KDS statistics
   * GET /api/kds/stats
   */
  async getStats(req, res, next) {
    try {
      const confirmedCount = await Order.count({
        where: {
          restaurantId: req.restaurantId,
          status: 'confirmed'
        }
      });

      const preparingCount = await Order.count({
        where: {
          restaurantId: req.restaurantId,
          status: 'preparing'
        }
      });

      const readyCount = await Order.count({
        where: {
          restaurantId: req.restaurantId,
          status: 'ready'
        }
      });

      // Get average preparation time for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = await Order.findAll({
        where: {
          restaurantId: req.restaurantId,
          status: { [Op.in]: ['ready', 'served', 'completed'] },
          confirmedAt: { [Op.gte]: today }
        },
        include: [
          {
            model: OrderItem,
            as: 'orderItems',
            attributes: ['startedAt', 'readyAt']
          }
        ]
      });

      let totalPrepTime = 0;
      let itemCount = 0;

      todayOrders.forEach(order => {
        order.orderItems.forEach(item => {
          if (item.startedAt && item.readyAt) {
            const prepTime = new Date(item.readyAt) - new Date(item.startedAt);
            totalPrepTime += prepTime;
            itemCount++;
          }
        });
      });

      const avgPrepTime = itemCount > 0 ? Math.round(totalPrepTime / itemCount / 60000) : 0; // in minutes

      res.json({
        stats: {
          confirmed: confirmedCount,
          preparing: preparingCount,
          ready: readyCount,
          averagePrepTime: avgPrepTime
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new KDSController();

