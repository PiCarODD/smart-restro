'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
      if (models.User) {
        Order.belongsTo(models.User, {
          foreignKey: 'waiterId',
          as: 'waiter'
        });
        Order.belongsTo(models.User, {
          foreignKey: 'cashierId',
          as: 'cashier'
        });
      }
      if (models.OrderItem) {
        Order.hasMany(models.OrderItem, {
          foreignKey: 'orderId',
          as: 'orderItems'
        });
      }
      if (models.Table) {
        Order.belongsTo(models.Table, {
          foreignKey: 'tableId',
          as: 'table'
        });
      }
      if (models.Payment) {
        Order.hasMany(models.Payment, {
          foreignKey: 'orderId',
          as: 'payments'
        });
      }
    }
  }

  Order.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'restaurant_id'
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'order_number'
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pending'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    orderType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'dine_in',
      field: 'order_type'
    },
    tableId: {
      type: DataTypes.UUID,
      field: 'table_id'
    },
    waiterId: {
      type: DataTypes.UUID,
      field: 'waiter_id'
    },
    cashierId: {
      type: DataTypes.UUID,
      field: 'cashier_id'
    },
    customerId: {
      type: DataTypes.UUID,
      field: 'customer_id'
    },
    customerName: {
      type: DataTypes.STRING(255),
      field: 'customer_name'
    },
    customerPhone: {
      type: DataTypes.STRING(50),
      field: 'customer_phone'
    },
    customerEmail: {
      type: DataTypes.STRING(255),
      field: 'customer_email'
    },
    guestCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'guest_count'
    },
    placedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'placed_at'
    },
    confirmedAt: {
      type: DataTypes.DATE,
      field: 'confirmed_at'
    },
    readyAt: {
      type: DataTypes.DATE,
      field: 'ready_at'
    },
    servedAt: {
      type: DataTypes.DATE,
      field: 'served_at'
    },
    completedAt: {
      type: DataTypes.DATE,
      field: 'completed_at'
    },
    cancelledAt: {
      type: DataTypes.DATE,
      field: 'cancelled_at'
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'discount_amount'
    },
    discountReason: {
      type: DataTypes.STRING(255),
      field: 'discount_reason'
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'tax_amount'
    },
    serviceCharge: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'service_charge'
    },
    tipAmount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'tip_amount'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'total_amount'
    },
    paymentStatus: {
      type: DataTypes.STRING(50),
      defaultValue: 'unpaid',
      field: 'payment_status'
    },
    notes: {
      type: DataTypes.TEXT
    },
    kitchenNotes: {
      type: DataTypes.TEXT,
      field: 'kitchen_notes'
    },
    source: {
      type: DataTypes.STRING(50),
      defaultValue: 'pos',
      field: 'source'
    },
    stockDeducted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'stock_deducted'
    },
    stockDeductedAt: {
      type: DataTypes.DATE,
      field: 'stock_deducted_at'
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      afterUpdate: async function(order, options) {
        // Check if payment status changed to 'paid'
        if (order.changed('paymentStatus') && order.paymentStatus === 'paid') {
          try {
            const { onPaymentStatusUpdate } = require('../utils/qrPaymentHook');
            // Get io instance if available
            const io = options.io || null;
            await onPaymentStatusUpdate(order.id, 'paid', order.restaurantId, io);
          } catch (error) {
            console.error('Error in payment status update hook:', error);
            // Don't throw - hooks shouldn't break the update
          }
        }
      }
    }
  });

  return Order;
};

