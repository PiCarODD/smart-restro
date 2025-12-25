'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ingredients', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      restaurant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'restaurants', key: 'id' },
        onDelete: 'CASCADE'
      },
      category_id: {
        type: Sequelize.UUID,
        references: { model: 'ingredient_categories', key: 'id' },
        onDelete: 'SET NULL'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      sku: {
        type: Sequelize.STRING(100)
      },
      barcode: {
        type: Sequelize.STRING(100)
      },
      category: {
        type: Sequelize.STRING(100)
      },
      unit: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      unit_cost: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        defaultValue: 0
      },
      current_stock: {
        type: Sequelize.DECIMAL(12, 3),
        defaultValue: 0
      },
      minimum_stock: {
        type: Sequelize.DECIMAL(12, 3),
        defaultValue: 0
      },
      maximum_stock: {
        type: Sequelize.DECIMAL(12, 3)
      },
      reorder_quantity: {
        type: Sequelize.DECIMAL(12, 3)
      },
      preferred_supplier_id: {
        type: Sequelize.UUID
      },
      supplier_name: {
        type: Sequelize.STRING(255)
      },
      supplier_sku: {
        type: Sequelize.STRING(100)
      },
      storage_location: {
        type: Sequelize.STRING(100)
      },
      storage_temp: {
        type: Sequelize.STRING(50)
      },
      shelf_life_days: {
        type: Sequelize.INTEGER
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('ingredients', ['restaurant_id'], { name: 'idx_ingredients_restaurant' });
    await queryInterface.addIndex('ingredients', ['category'], { name: 'idx_ingredients_category' });
    await queryInterface.addIndex('ingredients', ['restaurant_id', 'current_stock', 'minimum_stock'], { name: 'idx_ingredients_low_stock' });
    await queryInterface.addConstraint('ingredients', {
      fields: ['restaurant_id', 'name'],
      type: 'unique',
      name: 'unique_ingredient_name_per_restaurant'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ingredients');
  }
};

