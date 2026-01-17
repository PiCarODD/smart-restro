const qrCodeService = require('../services/qrCodeService');
const { Order } = require('../models');
const { Op } = require('sequelize');

/**
 * Hook to invalidate QR codes when payment is confirmed
 * This should be called whenever payment status changes to 'paid'
 */
async function handlePaymentConfirmation(orderId, restaurantId) {
    try {
        const order = await Order.findByPk(orderId, {
            attributes: ['id', 'tableId', 'paymentStatus']
        });

        if (!order || !order.tableId) {
            return; // No table associated, skip
        }

        // Check if all orders for this table are paid
        const unpaidOrders = await Order.count({
            where: {
                tableId: order.tableId,
                restaurantId,
                paymentStatus: {
                    [Op.in]: ['unpaid', 'partial']
                }
            }
        });

        // If all orders are paid, invalidate QR code
        if (unpaidOrders === 0) {
            await qrCodeService.invalidateQRCode(order.tableId);
            console.log(`QR code invalidated for table ${order.tableId} after payment confirmation`);
        }
    } catch (error) {
        console.error('Error in payment confirmation hook:', error);
        // Don't throw - this is a background hook
    }
}

/**
 * Hook to be called after payment status update
 * Call this from payment processing controllers/services
 */
async function onPaymentStatusUpdate(orderId, newPaymentStatus, restaurantId, io = null) {
    if (newPaymentStatus === 'paid') {
        await handlePaymentConfirmation(orderId, restaurantId);

        // Emit Socket.IO event for real-time updates
        if (io) {
            const order = await Order.findByPk(orderId, {
                attributes: ['id', 'tableId']
            });

            if (order && order.tableId) {
                io.to(`restaurant:${restaurantId}`).emit('qr:invalidated', {
                    tableId: order.tableId,
                    reason: 'payment_confirmed'
                });

                io.to(`table:${order.tableId}`).emit('qr:expired', {
                    reason: 'payment_confirmed',
                    message: 'Payment confirmed. QR code is no longer valid.'
                });
            }
        }
    }
}

module.exports = {
    handlePaymentConfirmation,
    onPaymentStatusUpdate
};
