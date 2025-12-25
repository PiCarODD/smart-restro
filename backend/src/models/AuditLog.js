'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
      AuditLog.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
      AuditLog.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  AuditLog.init({
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
    userId: {
      type: DataTypes.UUID,
      field: 'user_id'
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    entityType: {
      type: DataTypes.STRING(100),
      field: 'entity_type'
    },
    entityId: {
      type: DataTypes.UUID,
      field: 'entity_id'
    },
    changes: {
      type: DataTypes.JSONB
    },
    metadata: {
      type: DataTypes.JSONB
    }
  }, {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // Audit logs don't have updated_at
  });

  return AuditLog;
};

