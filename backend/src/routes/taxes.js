const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');
const authMiddleware = require('../middleware/auth');
const taxValidator = require('../validators/taxValidator');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Allow tenant_admin, admin, manager to access
router.use(authMiddleware.authorize('tenant_admin', 'admin', 'manager'));

router.get('/', taxController.list);
router.get('/:id', taxController.getById);
router.post('/', taxValidator.validateCreate, taxController.create);
router.put('/:id', taxValidator.validateUpdate, taxController.update);
router.delete('/:id', taxController.delete);

module.exports = router;

