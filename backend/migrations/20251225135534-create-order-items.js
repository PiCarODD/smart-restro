'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE'
      },
      menu_item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'menu_items', key: 'id' },
        onDelete: 'RESTRICT'
      },
      item_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      variant_name: {
        type: Sequelize.STRING(100)
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      unit_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      total_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      modifiers: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      modifiers_total: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      notes: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'pending'
      },
      kds_station: {
        type: Sequelize.STRING(100)
      },
      started_at: {
        type: Sequelize.DATE
      },
      ready_at: {
        type: Sequelize.DATE
      },
      course: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      fire_at: {
        type: Sequelize.DATE
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

    await queryInterface.addIndex('order_items', ['order_id'], { name: 'idx_order_items_order' });
    await queryInterface.addIndex('order_items', ['menu_item_id'], { name: 'idx_order_items_menu_item' });
    await queryInterface.addIndex('order_items', ['status'], { name: 'idx_order_items_status' });
    await queryInterface.addIndex('order_items', ['kds_station', 'status'], { name: 'idx_order_items_station' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('order_items');
  }
};

