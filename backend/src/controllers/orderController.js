const { Order, OrderItem, MenuItem, Table } = require('../models');
const { NotFoundError } = require('../utils/errors');
const orderService = require('../services/orderService');
const { Op } = require('sequelize');

class OrderController {
  /**
   * List orders
   * GET /api/orders
   */
  async list(req, res, next) {
    try {
      const { 
        tableId, 
        waiterId, 
        status, 
        orderType,
        startDate, 
        endDate,
        page = 1, 
        limit = 20 
      } = req.query;

      const where = {
        restaurantId: req.restaurantId // Only from JWT token, never from client
      };

      if (tableId) where.tableId = tableId;
      if (waiterId) where.waiterId = waiterId;
      if (status) where.status = status;
      if (orderType) where.orderType = orderType;
      
      if (startDate || endDate) {
        where.placedAt = {};
        if (startDate) where.placedAt[Op.gte] = new Date(startDate);
        if (endDate) where.placedAt[Op.lte] = new Date(endDate);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        include: [
          { model: Table, as: 'table', attributes: ['id', 'tableNumber', 'name'] },
          { model: require('../models').User, as: 'waiter', attributes: ['id', 'firstName', 'lastName'] },
          { model: OrderItem, as: 'orderItems', attributes: ['id', 'itemName', 'quantity', 'totalPrice'] }
        ],
        order: [['placed_at', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        orders,
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

  /**
   * Get order by ID
   * GET /api/orders/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await Order.findOne({
        where: { id, restaurantId: req.restaurantId },
        include: [
          { model: Table, as: 'table' },
          { model: require('../models').User, as: 'waiter', attributes: ['id', 'firstName', 'lastName'] },
          { model: require('../models').User, as: 'cashier', attributes: ['id', 'firstName', 'lastName'] },
          { 
            model: OrderItem, 
            as: 'orderItems',
            include: [{ model: MenuItem, as: 'menuItem', attributes: ['id', 'name', 'imageUrl'] }]
          }
        ]
      });

      if (!order) {
        throw new NotFoundError('Order');
      }

      res.json({ order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create order
   * POST /api/orders
   */
  async create(req, res, next) {
    try {
      const order = await orderService.createOrder(
        req.body,
        req.user.id,
        req.restaurantId
      );

      // Update table status if table is assigned
      if (order.tableId) {
        await Table.update(
          { currentOrderId: order.id, status: 'occupied', occupiedAt: new Date() },
          { where: { id: order.tableId } }
        );
      }

      // Emit real-time event
      if (req.app.get('io')) {
        req.app.get('io').to(`restaurant:${req.restaurantId}`).emit('order:created', order);
      }

      res.status(201).json({
        message: 'Order created successfully',
        order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order
   * PUT /api/orders/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const order = await Order.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!order) {
        throw new NotFoundError('Order');
      }

      await order.update(req.body);

      // Recalculate totals if items changed
      if (req.body.items !== undefined) {
        await orderService.calculateOrderTotals(id);
      }

      res.json({
        message: 'Order updated successfully',
        order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order status
   * PUT /api/orders/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const order = await orderService.updateOrderStatus(
        id,
        status,
        req.user.id,
        req.restaurantId
      );

      // Emit real-time events
      if (req.app.get('io')) {
        const io = req.app.get('io');
        io.to(`restaurant:${req.restaurantId}`).emit('order:status_changed', {
          orderId: id,
          status,
          order
        });

        // Notify waiter if order is ready
        if (status === 'ready' && order.waiterId) {
          io.to(`waiter:${order.waiterId}`).emit('order:ready', {
            orderId: id,
            tableId: order.tableId,
            orderNumber: order.orderNumber
          });
        }
      }

      res.json({
        message: 'Order status updated successfully',
        order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel order
   * DELETE /api/orders/:id
   */
  async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.updateOrderStatus(
        id,
        'cancelled',
        req.user.id,
        req.restaurantId
      );

      // Release table if assigned
      if (order.tableId) {
        await Table.update(
          { currentOrderId: null, status: 'available' },
          { where: { id: order.tableId } }
        );
      }

      // Emit real-time event
      if (req.app.get('io')) {
        req.app.get('io').to(`restaurant:${req.restaurantId}`).emit('order:cancelled', {
          orderId: id,
          order
        });
      }

      res.json({
        message: 'Order cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send order to kitchen
   * POST /api/orders/:id/send-to-kitchen
   */
  async sendToKitchen(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.updateOrderStatus(
        id,
        'preparing',
        req.user.id,
        req.restaurantId
      );

      // Update order items status
      await OrderItem.update(
        { status: 'preparing', startedAt: new Date() },
        { where: { orderId: id } }
      );

      // Emit to KDS
      if (req.app.get('io')) {
        req.app.get('io').to(`kds:${req.restaurantId}`).emit('order:sent_to_kitchen', {
          orderId: id,
          order
        });
      }

      res.json({
        message: 'Order sent to kitchen successfully',
        order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Split order
   * POST /api/orders/:id/split
   */
  async split(req, res, next) {
    try {
      const { id } = req.params;
      const result = await orderService.splitOrder(
        id,
        req.body,
        req.restaurantId
      );

      res.json({
        message: 'Order split successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Transfer order to another table
   * POST /api/orders/:id/transfer
   */
  async transfer(req, res, next) {
    try {
      const { id } = req.params;
      const { tableId } = req.body;

      const order = await orderService.transferOrder(
        id,
        tableId,
        req.restaurantId
      );

      res.json({
        message: 'Order transferred successfully',
        order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Merge orders
   * POST /api/orders/:id/merge
   */
  async merge(req, res, next) {
    try {
      const { id } = req.params;
      const { orderIds } = req.body;

      const order = await orderService.mergeOrders(
        orderIds || [id],
        id,
        req.restaurantId
      );

      res.json({
        message: 'Orders merged successfully',
        order
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();

