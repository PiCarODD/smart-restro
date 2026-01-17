const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const qrCodeController = require('../controllers/qrCodeController');
const authMiddleware = require('../middleware/auth');
const subscriptionCheck = require('../middleware/subscriptionCheck');
const tableValidator = require('../validators/tableValidator');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Allow tenant_admin, admin, manager, waiter to access
router.use(authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'));

router.get('/', tableController.list);
router.get('/:id', tableController.getById);
router.get('/:id/qr-code', tableController.getQRCode);
router.post('/', tableValidator.validateCreate, tableController.create);
router.put('/:id', tableValidator.validateUpdate, tableController.update);
router.delete('/:id', tableController.delete);
router.put('/:id/status', tableValidator.validateUpdateStatus, tableController.updateStatus);
router.get('/:id/orders', tableController.getOrderHistory);

// QR Code routes (requires enterprise tier)
router.get('/qr/table/:tableId', subscriptionCheck.requireFeature('qr_code'), qrCodeController.getQRCode);
router.post('/qr/table/:tableId/regenerate', subscriptionCheck.requireFeature('qr_code'), qrCodeController.regenerateQRCode);
router.post('/qr/table/:tableId/invalidate', subscriptionCheck.requireFeature('qr_code'), qrCodeController.invalidateQRCode);

module.exports = router;

