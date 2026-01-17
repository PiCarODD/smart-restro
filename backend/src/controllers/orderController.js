const { Order, OrderItem, MenuItem, Table, Notification } = require('../models');
const { NotFoundError, BadRequestError } = require('../utils/errors');
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
        shiftStartDate,
        page = 1, 
        limit = 20 
      } = req.query;

      const where = {
        restaurantId: req.restaurantId // Only from JWT token, never from client
      };

      // Auto-filter by waiterId for waiter/server roles
      if (req.user.role === 'waiter' || req.user.role === 'server') {
        where.waiterId = req.user.id;
      } else if (waiterId) {
        // Only allow non-waiter roles to filter by waiterId explicitly
        where.waiterId = waiterId;
      }

      if (tableId) where.tableId = tableId;
      if (status) where.status = status;
      if (orderType) where.orderType = orderType;
      
      if (startDate || endDate) {
        where.placedAt = {};
        if (startDate) where.placedAt[Op.gte] = new Date(startDate);
        if (endDate) where.placedAt[Op.lte] = new Date(endDate);
      }

      // Filter by shift start time if provided (for waiter shift filtering)
      if (shiftStartDate) {
        if (!where.placedAt) {
          where.placedAt = {};
        }
        where.placedAt[Op.gte] = new Date(shiftStartDate);
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
      // Auto-set waiterId for waiter/server roles
      const orderData = { ...req.body };
      if (req.user.role === 'waiter' || req.user.role === 'server') {
        orderData.waiterId = req.user.id; // Always use current user's ID for waiters
      }

      const order = await orderService.createOrder(
        orderData,
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

          await Notification.create({
            restaurantId: req.restaurantId,
            userId: order.waiterId,
            type: 'order_ready',
            title: `Order ${order.orderNumber} Ready`,
            message: `Your order for Table ${order.tableId} is ready for pickup`,
            data: {
              orderId: id,
              tableId: order.tableId,
              orderNumber: order.orderNumber
            }
          });

          io.to(`waiter:${order.waiterId}`).emit('notification:new', {
            id: Date.now().toString(),
            type: 'order_ready',
            title: `Order ${order.orderNumber} Ready`,
            message: `Your order for Table ${order.tableId} is ready for pickup`,
            data: {
              orderId: id,
              tableId: order.tableId,
              orderNumber: order.orderNumber
            },
            read: false,
            createdAt: new Date().toISOString()
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
      
      // First verify the order exists and belongs to restaurant
      const existingOrder = await Order.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!existingOrder) {
        throw new NotFoundError('Order');
      }

      // First confirm the order (pending → confirmed)
      let order = await orderService.updateOrderStatus(
        id,
        'confirmed',
        req.user.id,
        req.restaurantId
      );

      // Then move to preparing (confirmed → preparing)
      // This represents the order being sent to kitchen and ready for preparation
      order = await orderService.updateOrderStatus(
        id,
        'preparing',
        req.user.id,
        req.restaurantId
      );

      // Reload order with items to return complete data
      const updatedOrder = await Order.findByPk(id, {
        include: [
          { model: OrderItem, as: 'orderItems' },
          { model: Table, as: 'table' },
          { model: require('../models').User, as: 'waiter', attributes: ['id', 'firstName', 'lastName'] }
        ]
      });

      // Update order items status to preparing
      await OrderItem.update(
        { status: 'preparing', startedAt: new Date() },
        { where: { orderId: id } }
      );

      // Emit real-time events
      const io = req.app.get('io');
      if (io) {
        // Emit to KDS
        io.to(`kds:${req.restaurantId}`).emit('order:sent_to_kitchen', {
          orderId: id,
          order: updatedOrder
        });
        
        // Emit to restaurant room for all connected clients
        io.to(`restaurant:${req.restaurantId}`).emit('order:status_changed', {
          orderId: id,
          status: 'preparing',
          order: updatedOrder
        });
      }

      res.json({
        message: 'Order sent to kitchen successfully',
        order: updatedOrder
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Pick up order from kitchen (waiter picks up ready order)
   * POST /api/orders/:id/pickup
   */
  async pickup(req, res, next) {
    try {
      const { id } = req.params;

      const order = await Order.findOne({
        where: { id, restaurantId: req.restaurantId },
        include: [{ model: OrderItem, as: 'orderItems' }]
      });

      if (!order) {
        throw new NotFoundError('Order');
      }

      if (order.status !== 'ready') {
        return res.status(400).json({
          error: 'Order is not ready for pickup',
          currentStatus: order.status
        });
      }

      // Auto-mark all items as served
      await OrderItem.update(
        { status: 'served', servedAt: new Date() },
        { where: { orderId: id, status: { [Op.ne]: 'cancelled' } } }
      );

      // Update order status to picked_up
      await order.update({
        status: 'picked_up',
        pickedUpAt: new Date(),
        pickedUpBy: req.user.id
      });

      const updatedOrder = await Order.findByPk(id, {
        include: [
          { model: OrderItem, as: 'orderItems' },
          { model: require('../models').Table, as: 'table' }
        ]
      });

      // Emit events
      if (req.app.get('io')) {
        const io = req.app.get('io');

        // Notify KDS
        io.to(`kds:${req.restaurantId}`).emit('order:picked_up', {
          orderId: id,
          orderNumber: order.orderNumber,
          tableId: order.tableId,
          pickedUpBy: req.user.id
        });

        // Notify dashboard
        io.to(`restaurant:${req.restaurantId}`).emit('order:status_changed', {
          orderId: id,
          status: 'picked_up',
          order: updatedOrder
        });

        // Notify table if applicable
        if (order.tableId) {
          io.to(`table:${order.tableId}`).emit('order:picked_up', {
            orderId: id,
            orderNumber: order.orderNumber
          });
        }
      }

      res.json({
        message: 'Order picked up successfully',
        order: updatedOrder
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark order as served (after delivery to table)
   * POST /api/orders/:id/serve
   */
  async serve(req, res, next) {
    try {
      const { id } = req.params;

      const order = await Order.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!order) {
        throw new NotFoundError('Order');
      }

      if (!['ready', 'picked_up'].includes(order.status)) {
        return res.status(400).json({
          error: 'Order cannot be served in current status',
          currentStatus: order.status
        });
      }

      await order.update({
        status: 'served',
        servedAt: new Date()
      });

      const updatedOrder = await Order.findByPk(id, {
        include: [
          { model: OrderItem, as: 'orderItems' },
          { model: require('../models').Table, as: 'table' }
        ]
      });

      // Emit events
      if (req.app.get('io')) {
        const io = req.app.get('io');

        io.to(`kds:${req.restaurantId}`).emit('order:served', {
          orderId: id,
          orderNumber: order.orderNumber,
          tableId: order.tableId
        });

        io.to(`restaurant:${req.restaurantId}`).emit('order:status_changed', {
          orderId: id,
          status: 'served',
          order: updatedOrder
        });
      }

      res.json({
        message: 'Order marked as served',
        order: updatedOrder
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

  /**
   * Get order statistics
   * GET /api/orders/stats
   */
  async getStats(req, res, next) {
    try {
      const { Op } = require('sequelize');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const where = {
        restaurantId: req.restaurantId,
        status: { [Op.in]: ['served', 'completed'] },
        completedAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      };

      // Auto-filter by waiterId for waiter/server roles
      if (req.user.role === 'waiter' || req.user.role === 'server') {
        where.waiterId = req.user.id;
      }

      // Get today's completed orders
      const todayOrders = await Order.findAll({
        where,
        attributes: ['id', 'totalAmount', 'placedAt', 'servedAt', 'completedAt']
      });

      const todayOrdersCount = todayOrders.length;
      const todaySales = todayOrders.reduce((sum, order) => 
        sum + parseFloat(order.totalAmount?.toString() || '0'), 0
      );

      // Calculate average order time (from placed to served)
      let avgOrderTime = 0;
      if (todayOrders.length > 0) {
        const orderTimes = todayOrders
          .filter(order => order.placedAt && order.servedAt)
          .map(order => {
            const placed = new Date(order.placedAt);
            const served = new Date(order.servedAt);
            return (served - placed) / 1000 / 60; // Convert to minutes
          });

        if (orderTimes.length > 0) {
          avgOrderTime = Math.round(
            orderTimes.reduce((sum, time) => sum + time, 0) / orderTimes.length
          );
        }
      }

      // Get shift start time (frontend manages this in localStorage)
      // Return placeholder - frontend will override with localStorage value
      const shiftStart = 'N/A';

      res.json({
        todayOrders: todayOrdersCount,
        todaySales,
        avgOrderTime: avgOrderTime > 0 ? `${avgOrderTime} min` : 'N/A',
        shiftStart
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();

