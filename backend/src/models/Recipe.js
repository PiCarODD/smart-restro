'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Recipe extends Model {
    static associate(models) {
      Recipe.belongsTo(models.MenuItem, {
        foreignKey: 'menuItemId',
        as: 'menuItem'
      });
      Recipe.belongsTo(models.Ingredient, {
        foreignKey: 'ingredientId',
        as: 'ingredient'
      });
    }
  }

  Recipe.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    menuItemId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'menu_item_id'
    },
    ingredientId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'ingredient_id'
    },
    variantName: {
      type: DataTypes.STRING(100),
      field: 'variant_name'
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    wasteFactor: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 1.0,
      field: 'waste_factor'
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    sequelize,
    modelName: 'Recipe',
    tableName: 'recipes',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Recipe;
};

