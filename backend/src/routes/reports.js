const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const reportValidator = require('../validators/reportValidator');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Sales Reports
router.get('/sales/daily', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), reportValidator.validateDateRange, reportController.getDailySales);
router.get('/sales/hourly', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), reportValidator.validateDateRange, reportController.getHourlySales);
router.get('/sales/by-category', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), reportValidator.validateDateRange, reportController.getSalesByCategory);
router.get('/sales/by-item', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), reportValidator.validateDateRange, reportController.getTopSellingItems);

// Staff Reports
router.get('/staff/performance', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), reportValidator.validateDateRange, reportController.getStaffPerformance);

// Payment Reports
router.get('/payments/by-method', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), reportValidator.validateDateRange, reportController.getPaymentMethods);

// Inventory Reports
router.get('/inventory/usage', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), reportValidator.validateDateRange, reportController.getInventoryUsage);

// Summary
router.get('/summary', authMiddleware.authorize('tenant_admin', 'admin', 'manager'), reportValidator.validateDateRange, reportController.getSummary);

module.exports = router;

