'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Section extends Model {
    static associate(models) {
      Section.belongsTo(models.Restaurant, {
        foreignKey: 'restaurantId',
        as: 'restaurant'
      });
      if (models.Table) {
        Section.hasMany(models.Table, {
          foreignKey: 'sectionId',
          as: 'tables'
        });
      }
    }
  }

  Section.init({
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
    color: {
      type: DataTypes.STRING(20)
    },
    icon: {
      type: DataTypes.STRING(50)
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'display_order'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    modelName: 'Section',
    tableName: 'sections',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Section;
};

