const express = require('express');
const router = express.Router();
const waiterController = require('../controllers/waiterController');
const waiterValidator = require('../validators/waiterValidator');
const authMiddleware = require('../middleware/auth');
const subscriptionCheck = require('../middleware/subscriptionCheck');

// All routes require authentication and waiter_app feature (professional+)
router.use(authMiddleware.authenticate);
router.use(subscriptionCheck.requireFeature('waiter_app'));

// Waiter routes - accessible by waiter role and above
router.get('/tables', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), waiterController.getTables);
router.get('/orders', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), waiterController.getOrders);
router.post('/orders', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), waiterValidator.validateCreateOrder, waiterController.createOrder);
router.get('/notifications', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), waiterController.getNotifications);
router.put('/notifications/:id/read', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), waiterController.markNotificationRead);
router.put('/notifications/read-all', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), waiterController.markAllNotificationsRead);

module.exports = router;

