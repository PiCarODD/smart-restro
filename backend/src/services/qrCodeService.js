const { Table, Order, Restaurant, OrderItem, MenuItem, sequelize } = require('../models');
const { Op } = require('sequelize');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

class QRCodeService {
    /**
     * Generate QR code for a table
     */
    async generateQRCode(tableId, restaurantId) {
        const table = await Table.findOne({
            where: { id: tableId, restaurantId },
            include: [{ model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'slug'] }]
        });

        if (!table) {
            throw new NotFoundError('Table');
        }

        // Generate unique token
        const token = uuidv4();
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const qrUrl = `${frontendUrl}/qr/${token}`;

        // Generate QR code image (as data URL)
        let qrCodeDataUrl;
        try {
            qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                width: 300,
                margin: 1
            });
        } catch (error) {
            console.error('Failed to generate QR code image:', error);
            throw new ValidationError('Failed to generate QR code');
        }

        // Update table with QR code info
        await table.update({
            qrCodeToken: token,
            qrCodeGeneratedAt: new Date(),
            qrCodeExpiresAt: null // Will expire when payment is confirmed
        });

        return {
            token,
            qrUrl,
            qrCodeImage: qrCodeDataUrl,
            tableId: table.id,
            tableNumber: table.tableNumber,
            restaurantId: table.restaurantId,
            restaurant: table.restaurant
        };
    }

    /**
     * Validate QR token and return table info
     */
    async validateQRToken(token) {
        const table = await Table.findOne({
            where: { qrCodeToken: token },
            include: [
                { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'slug', 'logoUrl', 'phone', 'address'] }
            ]
        });

        if (!table) {
            throw new NotFoundError('QR code not found or invalid');
        }

        // Check if QR is expired
        if (table.qrCodeExpiresAt && new Date() > new Date(table.qrCodeExpiresAt)) {
            throw new ValidationError('QR code has expired');
        }

        // Check if QR should be expired (all orders paid)
        const hasUnpaidOrders = await this.hasUnpaidOrders(table.id);
        if (!hasUnpaidOrders && table.qrCodeExpiresAt === null) {
            // Auto-expire if all orders are paid
            await table.update({ qrCodeExpiresAt: new Date() });
            throw new ValidationError('All orders have been paid. QR code is no longer valid.');
        }

        return {
            tableId: table.id,
            tableNumber: table.tableNumber,
            tableName: table.name,
            restaurantId: table.restaurantId,
            restaurant: table.restaurant,
            isValid: !table.qrCodeExpiresAt || new Date() <= new Date(table.qrCodeExpiresAt)
        };
    }

    /**
     * Get all unpaid orders for a table
     */
    async getTableOrdersForQR(tableId) {
        const orders = await Order.findAll({
            where: {
                tableId,
                paymentStatus: {
                    [Op.in]: ['unpaid', 'partial']
                }
            },
            include: [
                {
                    model: OrderItem,
                    as: 'orderItems',
                    include: [
                        {
                            model: MenuItem,
                            as: 'menuItem',
                            attributes: ['id', 'name', 'imageUrl', 'description']
                        }
                    ]
                },
                {
                    model: require('../models').User,
                    as: 'waiter',
                    attributes: ['id', 'firstName', 'lastName'],
                    required: false
                }
            ],
            order: [['placedAt', 'DESC']]
        });

        return orders;
    }

    /**
     * Check if table has unpaid orders
     */
    async hasUnpaidOrders(tableId) {
        const count = await Order.count({
            where: {
                tableId,
                paymentStatus: {
                    [Op.in]: ['unpaid', 'partial']
                }
            }
        });
        return count > 0;
    }

    /**
     * Check if QR is valid and table can accept orders
     */
    async canCreateOrderViaQR(token) {
        const tableInfo = await this.validateQRToken(token);
        return {
            canCreate: tableInfo.isValid,
            tableId: tableInfo.tableId,
            restaurantId: tableInfo.restaurantId
        };
    }

    /**
     * Invalidate QR code (called when payment is confirmed)
     */
    async invalidateQRCode(tableId) {
        const table = await Table.findByPk(tableId);
        if (!table) {
            throw new NotFoundError('Table');
        }

        await table.update({
            qrCodeExpiresAt: new Date()
        });

        return table;
    }

    /**
     * Regenerate QR code for a table
     */
    async regenerateQRCode(tableId, restaurantId) {
        // First invalidate existing QR
        await this.invalidateQRCode(tableId);
        // Generate new one
        return await this.generateQRCode(tableId, restaurantId);
    }

    /**
     * Check if QR should be expired based on payment status
     */
    async checkQRExpiry(tableId) {
        const table = await Table.findByPk(tableId);
        if (!table) {
            return false;
        }

        // If already expired, return true
        if (table.qrCodeExpiresAt && new Date() > new Date(table.qrCodeExpiresAt)) {
            return true;
        }

        // Check if all orders are paid
        const hasUnpaid = await this.hasUnpaidOrders(tableId);
        if (!hasUnpaid && table.qrCodeExpiresAt === null) {
            // Auto-expire
            await table.update({ qrCodeExpiresAt: new Date() });
            return true;
        }

        return false;
    }

    /**
     * Get QR code info for a table (for waiter app)
     */
    async getQRCode(tableId, restaurantId) {
        const table = await Table.findOne({
            where: { id: tableId, restaurantId },
            include: [{ model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'slug'] }]
        });

        if (!table) {
            throw new NotFoundError('Table');
        }

        if (!table.qrCodeToken) {
            return null;
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const qrUrl = `${frontendUrl}/qr/${table.qrCodeToken}`;

        // Generate QR code image
        let qrCodeDataUrl;
        try {
            qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                width: 300,
                margin: 1
            });
        } catch (error) {
            console.error('Failed to generate QR code image:', error);
        }

        const isExpired = table.qrCodeExpiresAt && new Date() > new Date(table.qrCodeExpiresAt);

        return {
            token: table.qrCodeToken,
            qrUrl,
            qrCodeImage: qrCodeDataUrl,
            generatedAt: table.qrCodeGeneratedAt,
            expiresAt: table.qrCodeExpiresAt,
            isExpired,
            isValid: !isExpired
        };
    }
}

module.exports = new QRCodeService();
