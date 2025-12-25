const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const orderItemController = require('../controllers/orderItemController');
const authMiddleware = require('../middleware/auth');
const orderValidator = require('../validators/orderValidator');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Orders routes
router.get('/', orderController.list);
router.get('/:id', orderController.getById);
router.post('/', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server', 'cashier'), orderValidator.validateCreate, orderController.create);
router.put('/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'cashier'), orderValidator.validateUpdate, orderController.update);
router.put('/:id/status', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'cashier'), orderValidator.validateUpdateStatus, orderController.updateStatus);
router.delete('/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), orderController.cancel);

// Quick actions
router.post('/:id/send-to-kitchen', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), orderController.sendToKitchen);
router.post('/:id/split', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'cashier'), orderValidator.validateSplit, orderController.split);
router.post('/:id/transfer', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter'), orderValidator.validateTransfer, orderController.transfer);
router.post('/:id/merge', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'cashier'), orderValidator.validateMerge, orderController.merge);

// Order items routes
router.post('/:id/items', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server', 'cashier'), orderValidator.validateAddItem, orderItemController.addItem);
router.put('/:id/items/:itemId', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'cashier'), orderValidator.validateUpdateItem, orderItemController.updateItem);
router.delete('/:id/items/:itemId', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'cashier'), orderItemController.removeItem);
router.put('/:id/items/:itemId/status', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'cook'), orderValidator.validateUpdateItemStatus, orderItemController.updateItemStatus);

module.exports = router;

