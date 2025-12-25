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

router.get('/', restaurantController.list);
router.get('/:id', restaurantController.getById);
router.put('/:id', restaurantValidator.validateUpdate, restaurantController.update);
router.get('/:id/settings', restaurantController.getSettings);
router.put('/:id/settings', restaurantValidator.validateSettings, restaurantController.updateSettings);
router.put('/:id/logo', uploadLogo, restaurantController.uploadLogo);

module.exports = router;

