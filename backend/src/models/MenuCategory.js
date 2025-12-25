'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MenuCategory extends Model {
    static associate(models) {
      MenuCategory.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
      if (models.MenuCategory) {
        MenuCategory.belongsTo(models.MenuCategory, {
          foreignKey: 'parentId',
          as: 'parent'
        });
        MenuCategory.hasMany(models.MenuCategory, {
          foreignKey: 'parentId',
          as: 'subcategories'
        });
      }
      if (models.MenuItem) {
        MenuCategory.hasMany(models.MenuItem, {
          foreignKey: 'categoryId',
          as: 'menuItems'
        });
      }
    }
  }

  MenuCategory.init({
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
    parentId: {
      type: DataTypes.UUID,
      field: 'parent_id'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      field: 'image_url'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'display_order'
    },
    color: {
      type: DataTypes.STRING(20)
    },
    icon: {
      type: DataTypes.STRING(50)
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
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
    kdsStation: {
      type: DataTypes.STRING(100),
      field: 'kds_station'
    }
  }, {
    sequelize,
    modelName: 'MenuCategory',
    tableName: 'menu_categories',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return MenuCategory;
};

