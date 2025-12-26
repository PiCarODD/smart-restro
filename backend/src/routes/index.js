const express = require('express');
const router = express.Router();
const path = require('path');

const authRoutes = require('./auth');
const userRoutes = require('./users');
const tenantRoutes = require('./tenant');
const restaurantRoutes = require('./restaurants');
const taxRoutes = require('./taxes');
const featureRoutes = require('./features');
const sectionRoutes = require('./sections');
const tableRoutes = require('./tables');
const menuRoutes = require('./menu');
const inventoryRoutes = require('./inventory');
const recipeRoutes = require('./recipes');
const orderRoutes = require('./orders');
const kdsRoutes = require('./kds');
const reportRoutes = require('./reports');
const waiterRoutes = require('./waiter');
const uploadRoutes = require('./upload');

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve uploaded files
router.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tenant', tenantRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/taxes', taxRoutes);
router.use('/features', featureRoutes);
router.use('/sections', sectionRoutes);
router.use('/tables', tableRoutes);
router.use('/menu', menuRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/recipes', recipeRoutes);
router.use('/orders', orderRoutes);
router.use('/kds', kdsRoutes);
router.use('/reports', reportRoutes);
router.use('/waiter', waiterRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;

