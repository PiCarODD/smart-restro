'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
      if (models.MenuItem) {
        OrderItem.belongsTo(models.MenuItem, {
          foreignKey: 'menuItemId',
          as: 'menuItem'
        });
      }
    }
  }

  OrderItem.init({
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
    menuItemId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'menu_item_id'
    },
    itemName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'item_name'
    },
    variantName: {
      type: DataTypes.STRING(100),
      field: 'variant_name'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'unit_price'
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'total_price'
    },
    modifiers: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'modifiers'
    },
    modifiersTotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      field: 'modifiers_total'
    },
    notes: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'pending',
      field: 'status'
    },
    kdsStation: {
      type: DataTypes.STRING(100),
      field: 'kds_station'
    },
    startedAt: {
      type: DataTypes.DATE,
      field: 'started_at'
    },
    readyAt: {
      type: DataTypes.DATE,
      field: 'ready_at'
    },
    course: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'course'
    },
    fireAt: {
      type: DataTypes.DATE,
      field: 'fire_at'
    }
  }, {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return OrderItem;
};

