const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const userValidator = require('../validators/userValidator');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Routes that require admin/manager role
router.get('/', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), userController.list);
router.post('/', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), userValidator.validateCreate, userController.create);
router.delete('/:id', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), userController.delete);

// Get user by ID - allow users to get their own profile or admins to get any profile
router.get('/:id', userController.getById);

// Update user - allow users to update themselves or admins to update any user
router.put('/:id', userValidator.validateUpdate, userController.update);

// Change password - allow users to change their own password or admins to change any password
router.put('/:id/password', userValidator.validateChangePassword, userController.changePassword);

module.exports = router;

