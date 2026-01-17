const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const authValidator = require('../validators/authValidator');
const { pinLoginLimiter } = require('../middleware/rateLimit');

router.post('/login', authValidator.validateLogin, authController.login);

router.post('/login/pin', pinLoginLimiter, authValidator.validatePinLogin, authController.loginWithPin);

router.post('/refresh', authController.refresh);

router.post('/logout', authController.logout);

// Protected routes
router.get('/me', authMiddleware.authenticate, authController.getMe);
router.post('/refresh', authMiddleware.authenticate, authController.refresh);
router.post('/logout', authMiddleware.authenticate, authController.logout);

// Super Admin only
router.post(
    '/impersonate',
    authMiddleware.authorize('super_admin'),
    authController.impersonate
);

module.exports = router;

