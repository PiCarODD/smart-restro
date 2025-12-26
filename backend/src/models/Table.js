'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Table extends Model {
    static associate(models) {
      Table.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
      if (models.Section) {
        Table.belongsTo(models.Section, {
          foreignKey: 'sectionId',
          as: 'sectionData'
        });
      }
      if (models.Order) {
        Table.hasMany(models.Order, {
          foreignKey: 'tableId',
          as: 'orders'
        });
        Table.belongsTo(models.Order, {
          foreignKey: 'currentOrderId',
          as: 'currentOrder'
        });
      }
    }
  }

  Table.init({
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
    sectionId: {
      type: DataTypes.UUID,
      field: 'section_id'
    },
    tableNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'table_number'
    },
    name: {
      type: DataTypes.STRING(100)
    },
    section: {
      type: DataTypes.STRING(100)
    },
    floor: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4
    },
    shape: {
      type: DataTypes.STRING(20),
      defaultValue: 'square'
    },
    positionX: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'position_x'
    },
    positionY: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'position_y'
    },
    width: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    },
    height: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    },
    rotation: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'available'
    },
    externalToken: {
      type: DataTypes.STRING(100),
      unique: true,
      field: 'external_token'
    },
    qrCodeUrl: {
      type: DataTypes.STRING(500),
      field: 'qr_code_url'
    },
    currentOrderId: {
      type: DataTypes.UUID,
      field: 'current_order_id'
    },
    occupiedAt: {
      type: DataTypes.DATE,
      field: 'occupied_at'
    },
    guestCount: {
      type: DataTypes.INTEGER,
      field: 'guest_count'
    }
  }, {
    sequelize,
    modelName: 'Table',
    tableName: 'tables',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Table;
};

