'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Restaurant extends Model {
    static associate(models) {
      Restaurant.belongsTo(models.Tenant, {
        foreignKey: 'tenantId',
        as: 'tenant'
      });
      Restaurant.hasMany(models.User, {
        foreignKey: 'restaurantId',
        as: 'users'
      });
      if (models.Table) {
        Restaurant.hasMany(models.Table, {
          foreignKey: 'restaurantId',
          as: 'tables'
        });
      }
      if (models.MenuCategory) {
        Restaurant.hasMany(models.MenuCategory, {
          foreignKey: 'restaurantId',
          as: 'menuCategories'
        });
      }
      if (models.MenuItem) {
        Restaurant.hasMany(models.MenuItem, {
          foreignKey: 'restaurantId',
          as: 'menuItems'
        });
      }
      if (models.Ingredient) {
        Restaurant.hasMany(models.Ingredient, {
          foreignKey: 'restaurantId',
          as: 'ingredients'
        });
      }
      if (models.IngredientCategory) {
        Restaurant.hasMany(models.IngredientCategory, {
          foreignKey: 'restaurantId',
          as: 'ingredientCategories'
        });
      }
      if (models.InventoryTransaction) {
        Restaurant.hasMany(models.InventoryTransaction, {
          foreignKey: 'restaurantId',
          as: 'inventoryTransactions'
        });
      }
      if (models.Order) {
        Restaurant.hasMany(models.Order, {
          foreignKey: 'restaurantId',
          as: 'orders'
        });
      }
      if (models.FeatureToggle) {
        Restaurant.hasMany(models.FeatureToggle, {
          foreignKey: 'restaurantId',
          as: 'featureToggles'
        });
      }
      if (models.Tax) {
        Restaurant.hasMany(models.Tax, {
          foreignKey: 'restaurantId',
          as: 'taxes'
        });
      }
    }
  }

  Restaurant.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'tenant_id'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    addressLine1: {
      type: DataTypes.STRING(255),
      field: 'address_line1'
    },
    addressLine2: {
      type: DataTypes.STRING(255),
      field: 'address_line2'
    },
    city: {
      type: DataTypes.STRING(100)
    },
    state: {
      type: DataTypes.STRING(100)
    },
    postalCode: {
      type: DataTypes.STRING(20),
      field: 'postal_code'
    },
    country: {
      type: DataTypes.STRING(100),
      defaultValue: 'USA'
    },
    phone: {
      type: DataTypes.STRING(50)
    },
    email: {
      type: DataTypes.STRING(255)
    },
    website: {
      type: DataTypes.STRING(255)
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        features: {
          kds: { enabled: false },
          waiterApp: { enabled: false },
          inventory: { enabled: true, autoDeduction: false },
          reservations: { enabled: false },
          selfOrdering: { enabled: false },
          loyalty: { enabled: false }
        },
        operations: {
          taxRate: 8.0,
          serviceCharge: 0,
          currency: 'USD',
          timezone: 'America/New_York'
        },
        ui: {
          theme: 'light',
          primaryColor: '#1976d2'
        }
      }
    },
    logoUrl: {
      type: DataTypes.STRING(500),
      field: 'logo_url'
    },
    coverImageUrl: {
      type: DataTypes.STRING(500),
      field: 'cover_image_url'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    modelName: 'Restaurant',
    tableName: 'restaurants',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Restaurant;
};

