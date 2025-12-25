'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FeatureToggle extends Model {
    static associate(models) {
      if (models.Restaurant) {
        FeatureToggle.belongsTo(models.Restaurant, {
          foreignKey: 'restaurantId',
          as: 'restaurant'
        });
      }
    }
  }

  FeatureToggle.init({
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
    featureKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'feature_key'
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    config: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'config'
    }
  }, {
    sequelize,
    modelName: 'FeatureToggle',
    tableName: 'feature_toggles',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return FeatureToggle;
};

