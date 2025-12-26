const { Table, Order, OrderItem, User, Notification } = require('../models');
const { NotFoundError } = require('../utils/errors');
const { Op } = require('sequelize');
const orderService = require('../services/orderService');

class WaiterController {
  /**
   * Get assigned tables for waiter
   * GET /api/waiter/tables
   */
  async getTables(req, res, next) {
    try {
      // For now, return all tables in the restaurant
      // In future, can implement table assignment logic
      const tables = await Table.findAll({
        where: {
          restaurantId: req.restaurantId
        },
        include: [
          {
            model: Order,
            as: 'currentOrder',
            where: {
              status: { [Op.in]: ['pending', 'confirmed', 'preparing', 'ready'] }
            },
            required: false,
            attributes: ['id', 'orderNumber', 'status', 'guestCount', 'placedAt']
          }
        ],
        order: [['table_number', 'ASC']]
      });

      res.json({ tables });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get waiter's active orders
   * GET /api/waiter/orders
   */
  async getOrders(req, res, next) {
    try {
      const { status } = req.query;

      const where = {
        restaurantId: req.restaurantId,
        waiterId: req.user.id,
        status: {
          [Op.notIn]: ['completed', 'cancelled']
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
            model: OrderItem,
            as: 'orderItems',
            attributes: ['id', 'itemName', 'quantity', 'status']
          }
        ],
        order: [
          ['placed_at', 'DESC']
        ]
      });

      res.json({ orders });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create order from table (waiter app)
   * POST /api/waiter/orders
   */
  async createOrder(req, res, next) {
    try {
      const { tableId, guestCount, items = [] } = req.body;

      // Verify table exists and belongs to restaurant
      const table = await Table.findOne({
        where: {
          id: tableId,
          restaurantId: req.restaurantId
        }
      });

      if (!table) {
        throw new NotFoundError('Table');
      }

      // Use orderService to create order
      const orderData = {
        orderType: 'dine_in',
        tableId,
        waiterId: req.user.id,
        guestCount: guestCount || 1,
        source: 'waiter_app',
        items
      };

      const order = await orderService.createOrder(orderData, req.user.id, req.restaurantId);

      // Update table status
      await table.update({
        status: 'occupied',
        currentOrderId: order.id
      });

      res.status(201).json({
        message: 'Order created successfully',
        order
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get waiter's notifications
   * GET /api/waiter/notifications
   */
  async getNotifications(req, res, next) {
    try {
      const { unreadOnly, limit = 50 } = req.query;

      const where = {
        userId: req.user.id
      };

      if (unreadOnly === 'true') {
        where.isRead = false;
      }

      const notifications = await Notification.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit)
      });

      const unreadCount = await Notification.count({
        where: {
          userId: req.user.id,
          read: false
        }
      });

      res.json({
        notifications,
        unreadCount
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   * PUT /api/waiter/notifications/:id/read
   */
  async markNotificationRead(req, res, next) {
    try {
      const { id } = req.params;

      const notification = await Notification.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!notification) {
        throw new NotFoundError('Notification');
      }

      await notification.update({
        read: true,
        readAt: new Date()
      });

      res.json({
        message: 'Notification marked as read',
        notification
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PUT /api/waiter/notifications/read-all
   */
  async markAllNotificationsRead(req, res, next) {
    try {
      await Notification.update(
        {
          read: true,
          readAt: new Date()
        },
        {
          where: {
            userId: req.user.id,
            read: false
          }
        }
      );

      res.json({
        message: 'All notifications marked as read'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WaiterController();

