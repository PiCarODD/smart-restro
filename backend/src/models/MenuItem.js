'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MenuItem extends Model {
    static associate(models) {
      MenuItem.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
      if (models.MenuCategory) {
        MenuItem.belongsTo(models.MenuCategory, {
          foreignKey: 'categoryId',
          as: 'category'
        });
      }
      if (models.Recipe) {
        MenuItem.hasMany(models.Recipe, {
          foreignKey: 'menuItemId',
          as: 'recipes'
        });
      }
    }
  }

  MenuItem.init({
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
      allowNull: false,
      field: 'category_id'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    shortDescription: {
      type: DataTypes.STRING(500),
      field: 'short_description'
    },
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'base_price'
    },
    costPrice: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'cost_price'
    },
    variants: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    modifiers: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      field: 'image_url'
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: [],
      field: 'images'
    },
    calories: {
      type: DataTypes.INTEGER
    },
    allergens: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },
    dietaryTags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      field: 'dietary_tags'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'display_order'
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_featured'
    },
    isNew: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_new'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_available'
    },
    availableStartTime: {
      type: DataTypes.TIME,
      field: 'available_start_time'
    },
    availableEndTime: {
      type: DataTypes.TIME,
      field: 'available_end_time'
    },
    availableDays: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      field: 'available_days'
    },
    prepTimeMinutes: {
      type: DataTypes.INTEGER,
      field: 'prep_time_minutes'
    },
    kdsStation: {
      type: DataTypes.STRING(100),
      field: 'kds_station'
    },
    trackInventory: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'track_inventory'
    }
  }, {
    sequelize,
    modelName: 'MenuItem',
    tableName: 'menu_items',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return MenuItem;
};

