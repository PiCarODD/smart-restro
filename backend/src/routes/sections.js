const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const authMiddleware = require('../middleware/auth');
const sectionValidator = require('../validators/sectionValidator');

// All routes require authentication
router.use(authMiddleware.authenticate);

// GET routes - allow waiters/servers to read sections (they need to see table sections)
router.get('/', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), sectionController.list);
router.get('/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server'), sectionController.getById);

// Write routes - only allow tenant_admin, admin, manager
router.post('/', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), sectionValidator.validateCreate, sectionController.create);
router.put('/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), sectionValidator.validateUpdate, sectionController.update);
router.delete('/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), sectionController.delete);
router.put('/reorder', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), sectionValidator.validateReorder, sectionController.reorder);

module.exports = router;

