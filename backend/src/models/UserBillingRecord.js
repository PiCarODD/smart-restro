'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserBillingRecord extends Model {
    static associate(models) {
      UserBillingRecord.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
    }
  }

  UserBillingRecord.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'tenant_id'
    },
    billingMonth: {
      type: DataTypes.STRING(7), // Format: YYYY-MM
      allowNull: false,
      field: 'billing_month'
    },
    extraUsersCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'extra_users_count'
    },
    ratePerUser: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'rate_per_user'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_amount'
    },
    billedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'billed_at'
    }
  }, {
    sequelize,
    modelName: 'UserBillingRecord',
    tableName: 'user_billing_records',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return UserBillingRecord;
};
