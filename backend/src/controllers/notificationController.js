const { Notification } = require('../models');
const { NotFoundError } = require('../utils/errors');

class NotificationController {
  /**
   * Get user's notifications
   * GET /api/notifications
   */
  async getNotifications(req, res, next) {
    try {
      const { unreadOnly, limit = 50 } = req.query;

      const where = {
        restaurantId: req.restaurantId, // Filter by restaurant
        userId: req.user.id // Auto-filter by logged-in user
      };

      if (unreadOnly === 'true') {
        where.read = false;
      }

      const notifications = await Notification.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit)
      });

      const unreadCount = await Notification.count({
        where: {
          restaurantId: req.restaurantId,
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
   * PUT /api/notifications/:id/read
   */
  async markNotificationRead(req, res, next) {
    try {
      const { id } = req.params;

      const notification = await Notification.findOne({
        where: {
          id,
          restaurantId: req.restaurantId,
          userId: req.user.id // Ensure user can only mark their own notifications as read
        }
      });

      if (!notification) {
        throw new NotFoundError('Notification');
      }

      await notification.update({
        read: true,
        readAt: new Date()
      });

      // Emit real-time event if Socket.IO is available
      if (req.app.get('io')) {
        req.app.get('io').to(`user:${req.user.id}`).emit('notification:read', {
          notificationId: id
        });
      }

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
   * PUT /api/notifications/read-all
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
            restaurantId: req.restaurantId,
            userId: req.user.id, // Only mark current user's notifications
            read: false
          }
        }
      );

      // Emit real-time event if Socket.IO is available
      if (req.app.get('io')) {
        req.app.get('io').to(`user:${req.user.id}`).emit('notification:all_read');
      }

      res.json({
        message: 'All notifications marked as read'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
