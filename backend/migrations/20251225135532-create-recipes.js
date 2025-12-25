'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('recipes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      menu_item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'menu_items', key: 'id' },
        onDelete: 'CASCADE'
      },
      ingredient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'ingredients', key: 'id' },
        onDelete: 'CASCADE'
      },
      variant_name: {
        type: Sequelize.STRING(100)
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false
      },
      unit: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      waste_factor: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 1.0
      },
      notes: {
        type: Sequelize.TEXT
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

    await queryInterface.addIndex('recipes', ['menu_item_id'], { name: 'idx_recipes_menu_item' });
    await queryInterface.addIndex('recipes', ['ingredient_id'], { name: 'idx_recipes_ingredient' });
    await queryInterface.addConstraint('recipes', {
      fields: ['menu_item_id', 'ingredient_id', 'variant_name'],
      type: 'unique',
      name: 'unique_recipe_per_menu_item_ingredient_variant'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('recipes');
  }
};

