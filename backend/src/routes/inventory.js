const express = require('express');
const router = express.Router();
const ingredientCategoryController = require('../controllers/ingredientCategoryController');
const ingredientController = require('../controllers/ingredientController');
const inventoryController = require('../controllers/inventoryController');
const recipeController = require('../controllers/recipeController');
const authMiddleware = require('../middleware/auth');
const inventoryValidator = require('../validators/inventoryValidator');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Ingredient Categories - require admin/manager/inventory
router.get('/categories', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'inventory'), ingredientCategoryController.list);
router.get('/categories/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'inventory'), ingredientCategoryController.getById);
router.post('/categories', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'inventory'), inventoryValidator.validateCreateIngredientCategory, ingredientCategoryController.create);
router.put('/categories/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'inventory'), inventoryValidator.validateUpdateIngredientCategory, ingredientCategoryController.update);
router.delete('/categories/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'inventory'), ingredientCategoryController.delete);

// Ingredients - require admin/manager/inventory
router.get('/ingredients', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'inventory'), ingredientController.list);
router.get('/ingredients/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'inventory'), ingredientController.getById);
router.post('/ingredients', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'inventory'), inventoryValidator.validateCreateIngredient, ingredientController.create);
router.put('/ingredients/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'inventory'), inventoryValidator.validateUpdateIngredient, ingredientController.update);
router.delete('/ingredients/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'inventory'), ingredientController.delete);
router.put('/ingredients/:id/stock', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'inventory'), inventoryValidator.validateAdjustStock, ingredientController.adjustStock);

// Stock Operations - require admin/manager/inventory
router.get('/low-stock', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'inventory'), inventoryController.getLowStock);
router.post('/stock-take', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'inventory'), inventoryValidator.validateStockTake, inventoryController.stockTake);
router.get('/transactions', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'inventory'), inventoryController.getTransactions);

module.exports = router;

