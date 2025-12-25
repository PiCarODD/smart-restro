const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const userValidator = require('../validators/userValidator');

// All routes require authentication
router.use(authMiddleware.authenticate);

// All routes require admin/manager role
router.use(authMiddleware.authorize('tenant_admin', 'admin', 'manager'));

router.get('/', userController.list);
router.get('/:id', userController.getById);
router.post('/', userValidator.validateCreate, userController.create);
router.put('/:id', userValidator.validateUpdate, userController.update);
router.delete('/:id', userController.delete);
router.put('/:id/password', userValidator.validateChangePassword, userController.changePassword);

module.exports = router;

