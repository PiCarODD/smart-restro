'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_transactions', {
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
      ingredient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'ingredients', key: 'id' },
        onDelete: 'CASCADE'
      },
      transaction_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      quantity_change: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false
      },
      unit: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      stock_before: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false
      },
      stock_after: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false
      },
      reference_type: {
        type: Sequelize.STRING(50)
      },
      reference_id: {
        type: Sequelize.UUID
      },
      notes: {
        type: Sequelize.TEXT
      },
      cost_per_unit: {
        type: Sequelize.DECIMAL(10, 4)
      },
      total_cost: {
        type: Sequelize.DECIMAL(10, 2)
      },
      created_by: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('inventory_transactions', ['restaurant_id'], { name: 'idx_inventory_trans_restaurant' });
    await queryInterface.addIndex('inventory_transactions', ['ingredient_id'], { name: 'idx_inventory_trans_ingredient' });
    await queryInterface.addIndex('inventory_transactions', ['transaction_type'], { name: 'idx_inventory_trans_type' });
    await queryInterface.addIndex('inventory_transactions', ['reference_type', 'reference_id'], { name: 'idx_inventory_trans_reference' });
    await queryInterface.addIndex('inventory_transactions', ['created_at'], { name: 'idx_inventory_trans_created' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('inventory_transactions');
  }
};

