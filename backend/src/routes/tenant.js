const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Get current tenant
router.get('/me', tenantController.getCurrent);

module.exports = router;

