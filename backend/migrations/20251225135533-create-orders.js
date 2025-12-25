'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
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
      order_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      order_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'dine_in'
      },
      table_id: {
        type: Sequelize.UUID,
        references: { model: 'tables', key: 'id' },
        onDelete: 'SET NULL'
      },
      waiter_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      cashier_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      customer_id: {
        type: Sequelize.UUID
      },
      customer_name: {
        type: Sequelize.STRING(255)
      },
      customer_phone: {
        type: Sequelize.STRING(50)
      },
      customer_email: {
        type: Sequelize.STRING(255)
      },
      guest_count: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'pending'
      },
      placed_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      confirmed_at: {
        type: Sequelize.DATE
      },
      ready_at: {
        type: Sequelize.DATE
      },
      served_at: {
        type: Sequelize.DATE
      },
      completed_at: {
        type: Sequelize.DATE
      },
      cancelled_at: {
        type: Sequelize.DATE
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      discount_reason: {
        type: Sequelize.STRING(255)
      },
      tax_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      service_charge: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      tip_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      payment_status: {
        type: Sequelize.STRING(50),
        defaultValue: 'unpaid'
      },
      notes: {
        type: Sequelize.TEXT
      },
      kitchen_notes: {
        type: Sequelize.TEXT
      },
      source: {
        type: Sequelize.STRING(50),
        defaultValue: 'pos'
      },
      stock_deducted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      stock_deducted_at: {
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

    await queryInterface.addIndex('orders', ['restaurant_id'], { name: 'idx_orders_restaurant' });
    await queryInterface.addIndex('orders', ['table_id'], { name: 'idx_orders_table' });
    await queryInterface.addIndex('orders', ['waiter_id'], { name: 'idx_orders_waiter' });
    await queryInterface.addIndex('orders', ['status'], { name: 'idx_orders_status' });
    await queryInterface.addIndex('orders', ['placed_at'], { name: 'idx_orders_placed_at' });
    await queryInterface.addConstraint('orders', {
      fields: ['restaurant_id', 'order_number'],
      type: 'unique',
      name: 'unique_order_number_per_restaurant'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  }
};

