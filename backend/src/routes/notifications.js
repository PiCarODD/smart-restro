const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Get user's notifications - allow all authenticated roles
router.get('/', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server', 'cashier', 'cook', 'inventory'), notificationController.getNotifications);

// Mark notification as read
router.put('/:id/read', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server', 'cashier', 'cook', 'inventory'), notificationController.markNotificationRead);

// Mark all notifications as read
router.put('/read-all', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server', 'cashier', 'cook', 'inventory'), notificationController.markAllNotificationsRead);

module.exports = router;
