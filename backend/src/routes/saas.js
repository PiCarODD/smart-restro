const express = require('express');
const router = express.Router();
const saasController = require('../controllers/saasController');
const authMiddleware = require('../middleware/auth');
const saasValidator = require('../validators/saasValidator');
const exportController = require('../controllers/exportController');

// All routes require super_admin authentication
router.use(authMiddleware.authenticate);
router.use(authMiddleware.authorize('super_admin'));

// Stats & Analytics
router.get('/stats', saasController.getStats);
router.get('/analytics', saasController.getAnalytics);

// Tenants
router.get('/tenants', saasValidator.validateListQuery, saasController.listTenants);
router.post('/tenants', saasValidator.validateCreateTenant, saasController.createTenant);
router.get('/tenants/:id', saasController.getTenant);
router.put('/tenants/:id', saasValidator.validateUpdateTenant, saasController.updateTenant);
router.delete('/tenants/:id', saasController.deleteTenant);
router.get('/tenants/:id/admin', saasController.getTenantAdmin);
router.get('/tenants/:id/stats', saasController.getTenantStats);
router.post('/tenants/bulk', saasValidator.validateBulkTenantOperation, saasController.bulkTenantOperation);

// Users
router.get('/users', saasValidator.validateListQuery, saasController.listUsers);
router.get('/users/:id', saasController.getUser);
router.put('/users/:id', saasValidator.validateUpdateUser, saasController.updateUser);
router.post('/users/bulk', saasValidator.validateBulkUserOperation, saasController.bulkUserOperation);

// Subscriptions
router.put('/tenants/:id/subscription', saasValidator.validateUpdateSubscription, saasController.updateSubscription);
router.post('/subscriptions/bulk', saasValidator.validateBulkSubscriptionOperation, saasController.bulkSubscriptionOperation);
router.get('/subscriptions/history', saasController.getSubscriptionHistory);

// User Limits
router.get('/tenants/:id/user-limits', saasController.getUserLimits);
router.put('/tenants/:id/user-limits', saasValidator.validateUpdateUserLimit, saasController.updateUserLimits);
router.get('/tenants/:id/user-billing', saasController.getUserBilling);

// Export
router.get('/export/tenants', saasValidator.validateExportQuery, exportController.exportTenants);
router.get('/export/users', saasValidator.validateExportQuery, exportController.exportUsers);

module.exports = router;
