const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const authMiddleware = require('../middleware/auth');
const inventoryValidator = require('../validators/inventoryValidator');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Recipes - require admin/manager for create/update/delete
router.get('/:menuItemId', recipeController.getRecipe);
router.put('/:menuItemId', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), inventoryValidator.validateUpdateRecipe, recipeController.updateRecipe);
router.delete('/:menuItemId', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), recipeController.deleteRecipe);
router.get('/:menuItemId/cost', recipeController.calculateCost);

module.exports = router;

