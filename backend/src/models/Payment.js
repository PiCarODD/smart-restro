'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      if (models.Order) {
        Payment.belongsTo(models.Order, {
          foreignKey: 'orderId',
          as: 'order'
        });
      }
      if (models.User) {
        Payment.belongsTo(models.User, {
          foreignKey: 'processedBy',
          as: 'processedByUser'
        });
      }
    }
  }

  Payment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'order_id'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'payment_method'
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pending'
    }
  }, {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Payment;
};

