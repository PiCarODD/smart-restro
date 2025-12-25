'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
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
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      tip_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      payment_method: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      card_type: {
        type: Sequelize.STRING(50)
      },
      card_last_four: {
        type: Sequelize.STRING(4)
      },
      transaction_id: {
        type: Sequelize.STRING(255)
      },
      processor: {
        type: Sequelize.STRING(50)
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'pending'
      },
      refund_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      refund_reason: {
        type: Sequelize.TEXT
      },
      refunded_at: {
        type: Sequelize.DATE
      },
      processed_by: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
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

    await queryInterface.addIndex('payments', ['order_id'], { name: 'idx_payments_order' });
    await queryInterface.addIndex('payments', ['status'], { name: 'idx_payments_status' });
    await queryInterface.addIndex('payments', ['created_at'], { name: 'idx_payments_created_at' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};

