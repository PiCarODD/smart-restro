const express = require('express');
const router = express.Router();
const kdsController = require('../controllers/kdsController');
const kdsValidator = require('../validators/kdsValidator');
const authMiddleware = require('../middleware/auth');
const subscriptionCheck = require('../middleware/subscriptionCheck');

// All routes require authentication and KDS feature (professional+)
router.use(authMiddleware.authenticate);
router.use(subscriptionCheck.requireFeature('kds'));

// KDS routes - accessible by kitchen staff (cook role)
router.get('/orders', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'cook'), kdsController.getOrders);
router.get('/history', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'cook'), kdsController.getHistory);
router.get('/stats', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'cook'), kdsController.getStats);
router.put('/items/:id/status', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'cook'), kdsValidator.validateUpdateItemStatus, kdsController.updateItemStatus);
router.post('/orders/:id/bump', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'cook'), kdsController.bumpOrder);

module.exports = router;

