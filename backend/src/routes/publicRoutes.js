const express = require('express');
const router = express.Router();
const qrCodeController = require('../controllers/qrCodeController');
const { createRateLimiter } = require('../middleware/rateLimit');

// Rate limiting for public QR endpoints
const qrRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per IP
    message: 'Too many requests. Please try again later.'
});

// Public QR code routes (no authentication required, token-based)
router.get('/qr/:token', qrRateLimiter, qrCodeController.getTableInfo);
router.get('/qr/:token/orders', qrRateLimiter, qrCodeController.getTableOrders);
router.post('/qr/:token/orders', qrRateLimiter, qrCodeController.createOrderViaQR);
router.post('/qr/:token/request-payment', qrRateLimiter, qrCodeController.requestPayment);

module.exports = router;
