const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const authMiddleware = require('../middleware/auth');
const tenantValidator = require('../validators/tenantValidator');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Get current tenant
router.get('/me', tenantController.getCurrent);

// Update subscription tier (only for tenant_admin, super_admin, or admin)
router.put(
  '/me/subscription',
  authMiddleware.authorize('tenant_admin', 'super_admin', 'admin'),
  tenantValidator.validateUpdateSubscription,
  tenantController.updateSubscription
);

module.exports = router;

