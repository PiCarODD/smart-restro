const qrCodeService = require('../services/qrCodeService');
const orderService = require('../services/orderService');
const { Notification } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');

class QRCodeController {
    /**
     * Generate/Get QR code for table (waiter app)
     * GET /api/qr/table/:tableId
     */
    async getQRCode(req, res, next) {
        try {
            const { tableId } = req.params;
            const restaurantId = req.restaurantId;

            let qrCode = await qrCodeService.getQRCode(tableId, restaurantId);

            // If no QR exists, generate one
            if (!qrCode) {
                qrCode = await qrCodeService.generateQRCode(tableId, restaurantId);
            }

            res.json({ qrCode });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Regenerate QR code for table
     * POST /api/qr/table/:tableId/regenerate
     */
    async regenerateQRCode(req, res, next) {
        try {
            const { tableId } = req.params;
            const restaurantId = req.restaurantId;

            const qrCode = await qrCodeService.regenerateQRCode(tableId, restaurantId);

            // Emit real-time event
            if (req.app.get('io')) {
                req.app.get('io').to(`restaurant:${restaurantId}`).emit('qr:regenerated', {
                    tableId,
                    qrCode
                });
            }

            res.json({
                message: 'QR code regenerated successfully',
                qrCode
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Invalidate QR code manually (waiter app)
     * POST /api/qr/table/:tableId/invalidate
     */
    async invalidateQRCode(req, res, next) {
        try {
            const { tableId } = req.params;
            const restaurantId = req.restaurantId;

            // Verify table belongs to restaurant
            const { Table } = require('../models');
            const table = await Table.findOne({
                where: { id: tableId, restaurantId }
            });

            if (!table) {
                throw new NotFoundError('Table');
            }

            await qrCodeService.invalidateQRCode(tableId);

            // Emit real-time event
            if (req.app.get('io')) {
                req.app.get('io').to(`restaurant:${restaurantId}`).emit('qr:invalidated', {
                    tableId
                });
            }

            res.json({
                message: 'QR code invalidated successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get table info and menu via QR token (public)
     * GET /api/public/qr/:token
     */
    async getTableInfo(req, res, next) {
        try {
            const { token } = req.params;

            const tableInfo = await qrCodeService.validateQRToken(token);

            // Get menu items for the restaurant
            const { MenuItem, MenuCategory } = require('../models');
            const menuItems = await MenuItem.findAll({
                where: {
                    restaurantId: tableInfo.restaurantId,
                    isActive: true,
                    isAvailable: true
                },
                include: [
                    {
                        model: MenuCategory,
                        as: 'category',
                        attributes: ['id', 'name']
                    }
                ],
                order: [
                    [{ model: MenuCategory, as: 'category' }, 'sortOrder', 'ASC'],
                    ['sortOrder', 'ASC']
                ]
            });

            res.json({
                table: {
                    id: tableInfo.tableId,
                    number: tableInfo.tableNumber,
                    name: tableInfo.tableName
                },
                restaurant: tableInfo.restaurant,
                menuItems: menuItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    imageUrl: item.imageUrl,
                    basePrice: item.basePrice,
                    category: item.category ? {
                        id: item.category.id,
                        name: item.category.name
                    } : null,
                    isAvailable: item.isAvailable
                })),
                isValid: tableInfo.isValid
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get orders for table via QR token (public)
     * GET /api/public/qr/:token/orders
     */
    async getTableOrders(req, res, next) {
        try {
            const { token } = req.params;

            const tableInfo = await qrCodeService.validateQRToken(token);
            const orders = await qrCodeService.getTableOrdersForQR(tableInfo.tableId);

            // Calculate totals
            let totalAmount = 0;
            let totalItems = 0;

            orders.forEach(order => {
                totalAmount += parseFloat(order.totalAmount || 0);
                totalItems += order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            });

            res.json({
                orders: orders.map(order => ({
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    placedAt: order.placedAt,
                    subtotal: order.subtotal,
                    taxAmount: order.taxAmount,
                    serviceCharge: order.serviceCharge,
                    discountAmount: order.discountAmount,
                    totalAmount: order.totalAmount,
                    paymentStatus: order.paymentStatus,
                    items: order.orderItems?.map(item => ({
                        id: item.id,
                        name: item.itemName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                        notes: item.notes,
                        menuItem: item.menuItem ? {
                            id: item.menuItem.id,
                            name: item.menuItem.name,
                            imageUrl: item.menuItem.imageUrl
                        } : null
                    })) || [],
                    waiter: order.waiter ? {
                        name: `${order.waiter.firstName} ${order.waiter.lastName}`
                    } : null
                })),
                totals: {
                    totalAmount,
                    totalItems,
                    orderCount: orders.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create order via QR token (public)
     * POST /api/public/qr/:token/orders
     */
    async createOrderViaQR(req, res, next) {
        try {
            const { token } = req.params;
            const orderData = req.body;

            // Validate QR token and get table info
            const { canCreate, tableId, restaurantId } = await qrCodeService.canCreateOrderViaQR(token);

            if (!canCreate) {
                throw new ValidationError('QR code is not valid or has expired');
            }

            // Ensure order is for the correct table
            orderData.tableId = tableId;
            orderData.source = 'qr_code';
            orderData.orderType = orderData.orderType || 'dine_in';

            // Create order (no userId since it's public, use null or system user)
            const order = await orderService.createOrder(
                orderData,
                null, // No user for QR orders
                restaurantId
            );

            // Emit real-time event
            if (req.app.get('io')) {
                req.app.get('io').to(`restaurant:${restaurantId}`).emit('order:created', order);
                req.app.get('io').to(`restaurant:${restaurantId}`).emit('qr:order_created', {
                    token,
                    orderId: order.id,
                    tableId
                });
            }

            res.status(201).json({
                message: 'Order created successfully',
                order
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Request payment via QR token (public)
     * POST /api/public/qr/:token/request-payment
     */
    async requestPayment(req, res, next) {
        try {
            const { token } = req.params;
            const { message } = req.body;

            const tableInfo = await qrCodeService.validateQRToken(token);

            // Get restaurant staff (managers, cashiers)
            const { User } = require('../models');
            const staff = await User.findAll({
                where: {
                    tenantId: tableInfo.restaurant.tenantId || null,
                    role: {
                        [require('sequelize').Op.in]: ['manager', 'cashier', 'admin', 'tenant_admin']
                    },
                    isActive: true
                },
                attributes: ['id']
            });

            // Create notifications for staff
            const notifications = await Promise.all(
                staff.map(user =>
                    Notification.create({
                        userId: user.id,
                        tenantId: tableInfo.restaurant.tenantId || null,
                        restaurantId: tableInfo.restaurantId,
                        type: 'payment_request',
                        title: 'Payment Request',
                        message: message || `Table ${tableInfo.tableNumber} is requesting payment`,
                        data: {
                            tableId: tableInfo.tableId,
                            tableNumber: tableInfo.tableNumber,
                            qrToken: token
                        },
                        isRead: false
                    })
                )
            );

            // Emit real-time event
            if (req.app.get('io')) {
                req.app.get('io').to(`restaurant:${tableInfo.restaurantId}`).emit('payment:requested', {
                    tableId: tableInfo.tableId,
                    tableNumber: tableInfo.tableNumber,
                    token,
                    message: message || `Table ${tableInfo.tableNumber} is requesting payment`
                });

                // Notify specific users
                staff.forEach(user => {
                    req.app.get('io').to(`user:${user.id}`).emit('notification', {
                        type: 'payment_request',
                        title: 'Payment Request',
                        message: message || `Table ${tableInfo.tableNumber} is requesting payment`
                    });
                });
            }

            res.json({
                message: 'Payment request sent successfully',
                notificationsSent: notifications.length
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new QRCodeController();
