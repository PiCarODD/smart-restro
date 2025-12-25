'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('taxes', {
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
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      type: {
        type: Sequelize.STRING(50),
        defaultValue: 'percentage'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      applies_to: {
        type: Sequelize.STRING(50),
        defaultValue: 'all'
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

    await queryInterface.addIndex('taxes', ['restaurant_id'], { name: 'idx_taxes_restaurant' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('taxes');
  }
};

