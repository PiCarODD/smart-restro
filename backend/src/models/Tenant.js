'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tenant extends Model {
    static associate(models) {
      Tenant.hasMany(models.Restaurant, {
        foreignKey: 'tenantId',
        as: 'restaurants'
      });
      Tenant.hasMany(models.User, {
        foreignKey: 'tenantId',
        as: 'users'
      });
      if (models.AuditLog) {
        Tenant.hasMany(models.AuditLog, {
          foreignKey: 'tenantId',
          as: 'auditLogs'
        });
      }
      if (models.UserBillingRecord) {
        Tenant.hasMany(models.UserBillingRecord, {
          foreignKey: 'tenantId',
          as: 'billingRecords'
        });
      }
    }
  }

  Tenant.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    subscriptionTier: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'starter',
      field: 'subscription_tier'
    },
    subscriptionStatus: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'active',
      field: 'subscription_status'
    },
    subscriptionStartDate: {
      type: DataTypes.DATE,
      field: 'subscription_start_date'
    },
    subscriptionEndDate: {
      type: DataTypes.DATE,
      field: 'subscription_end_date'
    },
    stripeCustomerId: {
      type: DataTypes.STRING(255),
      field: 'stripe_customer_id'
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING(255),
      field: 'stripe_subscription_id'
    },
    maxRestaurants: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'max_restaurants'
    },
    maxUsers: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      field: 'max_users'
    },
    maxMenuItems: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      field: 'max_menu_items'
    },
    ownerEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'owner_email'
    },
    billingEmail: {
      type: DataTypes.STRING(255),
      field: 'billing_email'
    },
    phone: {
      type: DataTypes.STRING(50)
    },
    baseIncludedUsers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      field: 'base_included_users'
    },
    extraUsersCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'extra_users_count'
    },
    extraUserMonthlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 5000.00,
      field: 'extra_user_monthly_rate'
    },
    lastUserBillingDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_user_billing_date'
    }
  }, {
    sequelize,
    modelName: 'Tenant',
    tableName: 'tenants',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Tenant;
};

