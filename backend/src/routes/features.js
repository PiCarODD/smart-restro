const express = require('express');
const router = express.Router();
const featureToggleController = require('../controllers/featureToggleController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Allow tenant_admin, admin, manager to access
router.use(authMiddleware.authorize('tenant_admin', 'admin', 'manager'));

router.get('/', featureToggleController.list);
router.get('/:id', featureToggleController.getById);
router.put('/:featureKey', featureToggleController.upsert);
router.patch('/:id/toggle', featureToggleController.toggle);
router.delete('/:id', featureToggleController.delete);

module.exports = router;

