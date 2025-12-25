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

// Categories routes - require admin/manager
router.get('/categories', menuCategoryController.list);
router.get('/categories/:id', menuCategoryController.getById);
router.post('/categories', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuCategoryValidator.validateCreate, menuCategoryController.create);
router.put('/categories/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuCategoryValidator.validateUpdate, menuCategoryController.update);
router.delete('/categories/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuCategoryController.delete);
router.put('/categories/reorder', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuCategoryValidator.validateReorder, menuCategoryController.reorder);

// Menu items routes - require admin/manager for create/update/delete
router.get('/items', menuItemController.list);
router.get('/items/:id', menuItemController.getById);
router.post('/items', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuItemValidator.validateCreate, menuItemController.create);
router.put('/items/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuItemValidator.validateUpdate, menuItemController.update);
router.delete('/items/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuItemController.delete);
router.put('/items/:id/availability', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'cashier'), menuItemValidator.validateToggleAvailability, menuItemController.toggleAvailability);
router.put('/items/:id/image', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), uploadSingle('image'), menuItemController.uploadImage);
router.get('/items/:id/recipe', menuItemController.getRecipe);
router.put('/items/:id/recipe', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), menuItemController.updateRecipe);

module.exports = router;

