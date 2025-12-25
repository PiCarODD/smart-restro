const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const authMiddleware = require('../middleware/auth');
const sectionValidator = require('../validators/sectionValidator');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Allow tenant_admin, admin, manager to access
router.use(authMiddleware.authorize('tenant_admin', 'admin', 'manager'));

router.get('/', sectionController.list);
router.get('/:id', sectionController.getById);
router.post('/', sectionValidator.validateCreate, sectionController.create);
router.put('/:id', sectionValidator.validateUpdate, sectionController.update);
router.delete('/:id', sectionController.delete);
router.put('/reorder', sectionValidator.validateReorder, sectionController.reorder);

module.exports = router;

