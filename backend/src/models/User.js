'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
      User.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
      if (models.Order) {
        User.hasMany(models.Order, {
          foreignKey: 'waiterId',
          as: 'waiterOrders'
        });
        User.hasMany(models.Order, {
          foreignKey: 'cashierId',
          as: 'cashierOrders'
        });
      }
      if (models.Payment) {
        User.hasMany(models.Payment, {
          foreignKey: 'processedBy',
          as: 'payments'
        });
      }
      if (models.AuditLog) {
        User.hasMany(models.AuditLog, {
          foreignKey: 'userId',
          as: 'auditLogs'
        });
      }
    }
  }

  User.init({
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
    restaurantId: {
      type: DataTypes.UUID,
      field: 'restaurant_id'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash'
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name'
    },
    phone: {
      type: DataTypes.STRING(50)
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      field: 'avatar_url'
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'waiter'
    },
    pinCode: {
      type: DataTypes.STRING(10),
      field: 'pin_code'
    },
    assignedSections: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      field: 'assigned_sections'
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'two_factor_enabled'
    },
    twoFactorSecret: {
      type: DataTypes.STRING(255),
      field: 'two_factor_secret'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: 'last_login_at'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return User;
};

