'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InventoryTransaction extends Model {
    static associate(models) {
      InventoryTransaction.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
      InventoryTransaction.belongsTo(models.Ingredient, {
        foreignKey: 'ingredientId',
        as: 'ingredient'
      });
      if (models.User) {
        InventoryTransaction.belongsTo(models.User, {
          foreignKey: 'createdBy',
          as: 'createdByUser'
        });
      }
    }
  }

  InventoryTransaction.init({
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
    ingredientId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'ingredient_id'
    },
    transactionType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'transaction_type'
    },
    quantityChange: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      field: 'quantity_change'
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    stockBefore: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      field: 'stock_before'
    },
    stockAfter: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      field: 'stock_after'
    },
    referenceType: {
      type: DataTypes.STRING(50),
      field: 'reference_type'
    },
    referenceId: {
      type: DataTypes.UUID,
      field: 'reference_id'
    },
    notes: {
      type: DataTypes.TEXT
    },
    costPerUnit: {
      type: DataTypes.DECIMAL(10, 4),
      field: 'cost_per_unit'
    },
    totalCost: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'total_cost'
    },
    createdBy: {
      type: DataTypes.UUID,
      field: 'created_by'
    }
  }, {
    sequelize,
    modelName: 'InventoryTransaction',
    tableName: 'inventory_transactions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // Transactions are immutable
  });

  return InventoryTransaction;
};

