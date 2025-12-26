const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const authMiddleware = require('../middleware/auth');
const restaurantValidator = require('../validators/restaurantValidator');
const { uploadLogo } = require('../middleware/upload');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Allow tenant_admin, admin, manager to access
router.use(authMiddleware.authorize('tenant_admin', 'admin', 'manager'));

// Get current user's restaurant (no ID in URL - uses JWT token)
router.get('/me', restaurantController.getCurrent);
router.put('/me', restaurantValidator.validateUpdate, restaurantController.updateCurrent);
router.get('/me/settings', restaurantController.getCurrentSettings);
router.put('/me/settings', restaurantValidator.validateSettings, restaurantController.updateCurrentSettings);
router.put('/me/logo', uploadLogo, restaurantController.uploadCurrentLogo);

// List restaurants (for tenant_admin - can see all restaurants in tenant)
router.get('/', restaurantController.list);

module.exports = router;

