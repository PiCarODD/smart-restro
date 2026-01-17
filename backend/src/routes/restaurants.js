const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const authMiddleware = require('../middleware/auth');
const restaurantValidator = require('../validators/restaurantValidator');
const { uploadLogo } = require('../middleware/upload');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Get current user's restaurant - allow waiters/servers to read their restaurant info
router.get('/me', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), restaurantController.getCurrent);

// Write routes - only allow tenant_admin, admin, manager
router.put('/me', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), restaurantValidator.validateUpdate, restaurantController.updateCurrent);
router.get('/me/settings', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), restaurantController.getCurrentSettings);
router.put('/me/settings', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), restaurantValidator.validateSettings, restaurantController.updateCurrentSettings);
router.put('/me/logo', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), uploadLogo, restaurantController.uploadCurrentLogo);

// Create restaurant - only tenant_admin, admin, manager
router.post('/', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), restaurantController.create);

// List restaurants (for tenant_admin - can see all restaurants in tenant)
router.get('/', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), restaurantController.list);

module.exports = router;

