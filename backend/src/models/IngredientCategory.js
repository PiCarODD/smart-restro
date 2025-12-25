'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IngredientCategory extends Model {
    static associate(models) {
      IngredientCategory.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
      if (models.Ingredient) {
        IngredientCategory.hasMany(models.Ingredient, {
          foreignKey: 'categoryId',
          as: 'ingredients'
        });
      }
    }
  }

  IngredientCategory.init({
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'display_order'
    }
  }, {
    sequelize,
    modelName: 'IngredientCategory',
    tableName: 'ingredient_categories',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return IngredientCategory;
};

