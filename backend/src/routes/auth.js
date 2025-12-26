const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const authValidator = require('../validators/authValidator');

// Public routes
router.post('/login', authValidator.validateLogin, authController.login);
router.post('/login/pin', authValidator.validatePinLogin, authController.loginWithPin);

// Protected routes
router.get('/me', authMiddleware.authenticate, authController.getMe);
router.post('/refresh', authMiddleware.authenticate, authController.refresh);
router.post('/logout', authMiddleware.authenticate, authController.logout);

module.exports = router;

