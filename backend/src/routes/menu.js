const express = require('express');
const router = express.Router();
const menuCategoryController = require('../controllers/menuCategoryController');
const menuItemController = require('../controllers/menuItemController');
const authMiddleware = require('../middleware/auth');
const menuCategoryValidator = require('../validators/menuCategoryValidator');
const menuItemValidator = require('../validators/menuItemValidator');
const { uploadSingle } = require('../middleware/upload');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Read operations - require tenant_admin, admin, manager, waiter, server
router.get('/categories', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), menuCategoryController.list);
router.get('/categories/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), menuCategoryController.getById);
router.get('/items', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), menuItemController.list);
router.get('/items/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), menuItemController.getById);
router.get('/items/:id/recipe', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), menuItemController.getRecipe);

// Write operations - require tenant_admin, admin, manager
router.post('/categories', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuCategoryValidator.validateCreate, menuCategoryController.create);
router.put('/categories/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuCategoryValidator.validateUpdate, menuCategoryController.update);
router.delete('/categories/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuCategoryController.delete);
router.put('/categories/reorder', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuCategoryValidator.validateReorder, menuCategoryController.reorder);

router.post('/items', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuItemValidator.validateCreate, menuItemController.create);
router.put('/items/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuItemValidator.validateUpdate, menuItemController.update);
router.delete('/items/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuItemController.delete);
router.put('/items/:id/availability', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'cashier'), menuItemValidator.validateToggleAvailability, menuItemController.toggleAvailability);
router.put('/items/:id/image', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), uploadSingle('image'), menuItemController.uploadImage);
router.put('/items/:id/recipe', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuItemController.updateRecipe);

module.exports = router;

