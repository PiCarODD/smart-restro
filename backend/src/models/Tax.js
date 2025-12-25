'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tax extends Model {
    static associate(models) {
      if (models.Restaurant) {
        Tax.belongsTo(models.Restaurant, {
          foreignKey: 'restaurantId',
          as: 'restaurant'
        });
      }
    }
  }

  Tax.init({
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
    rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      defaultValue: 'percentage'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    appliesTo: {
      type: DataTypes.STRING(50),
      defaultValue: 'all',
      field: 'applies_to'
    }
  }, {
    sequelize,
    modelName: 'Tax',
    tableName: 'taxes',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Tax;
};

