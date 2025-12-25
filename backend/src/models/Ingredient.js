'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Ingredient extends Model {
    static associate(models) {
      Ingredient.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
      if (models.IngredientCategory) {
        Ingredient.belongsTo(models.IngredientCategory, {
          foreignKey: 'categoryId',
          as: 'ingredientCategory'
        });
      }
      if (models.Recipe) {
        Ingredient.hasMany(models.Recipe, {
          foreignKey: 'ingredientId',
          as: 'recipes'
        });
      }
      if (models.InventoryTransaction) {
        Ingredient.hasMany(models.InventoryTransaction, {
          foreignKey: 'ingredientId',
          as: 'transactions'
        });
      }
    }
  }

  Ingredient.init({
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
    categoryId: {
      type: DataTypes.UUID,
      field: 'category_id'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING(100)
    },
    barcode: {
      type: DataTypes.STRING(100)
    },
    category: {
      type: DataTypes.STRING(100)
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 0,
      field: 'unit_cost'
    },
    currentStock: {
      type: DataTypes.DECIMAL(12, 3),
      defaultValue: 0,
      field: 'current_stock'
    },
    minimumStock: {
      type: DataTypes.DECIMAL(12, 3),
      defaultValue: 0,
      field: 'minimum_stock'
    },
    maximumStock: {
      type: DataTypes.DECIMAL(12, 3),
      field: 'maximum_stock'
    },
    reorderQuantity: {
      type: DataTypes.DECIMAL(12, 3),
      field: 'reorder_quantity'
    },
    preferredSupplierId: {
      type: DataTypes.UUID,
      field: 'preferred_supplier_id'
    },
    supplierName: {
      type: DataTypes.STRING(255),
      field: 'supplier_name'
    },
    supplierSku: {
      type: DataTypes.STRING(100),
      field: 'supplier_sku'
    },
    storageLocation: {
      type: DataTypes.STRING(100),
      field: 'storage_location'
    },
    storageTemp: {
      type: DataTypes.STRING(50),
      field: 'storage_temp'
    },
    shelfLifeDays: {
      type: DataTypes.INTEGER,
      field: 'shelf_life_days'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    modelName: 'Ingredient',
    tableName: 'ingredients',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Ingredient;
};

