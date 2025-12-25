const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// All routes require authentication
router.use(authMiddleware.authenticate);

// Allow admin/manager to upload images
router.post('/image', 
  authMiddleware.authorize('tenant_admin', 'admin', 'manager'), 
  uploadSingle('image'), 
  uploadController.uploadImage
);

module.exports = router;

