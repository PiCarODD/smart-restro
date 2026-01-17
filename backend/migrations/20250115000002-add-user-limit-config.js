'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add user limit config fields to tenants table
    await queryInterface.addColumn('tenants', 'base_included_users', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 10
    });

    await queryInterface.addColumn('tenants', 'extra_users_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('tenants', 'extra_user_monthly_rate', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 5000.00
    });

    await queryInterface.addColumn('tenants', 'last_user_billing_date', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Create user_billing_records table
    await queryInterface.createTable('user_billing_records', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onDelete: 'CASCADE'
      },
      billing_month: {
        type: Sequelize.STRING(7), // Format: YYYY-MM
        allowNull: false
      },
      extra_users_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      rate_per_user: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      billed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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

    // Add indexes
    await queryInterface.addIndex('user_billing_records', ['tenant_id'], {
      name: 'idx_user_billing_tenant'
    });

    await queryInterface.addIndex('user_billing_records', ['billing_month'], {
      name: 'idx_user_billing_month'
    });

    await queryInterface.addConstraint('user_billing_records', {
      fields: ['tenant_id', 'billing_month'],
      type: 'unique',
      name: 'unique_tenant_billing_month'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop user_billing_records table
    await queryInterface.dropTable('user_billing_records');

    // Remove columns from tenants table
    await queryInterface.removeColumn('tenants', 'base_included_users');
    await queryInterface.removeColumn('tenants', 'extra_users_count');
    await queryInterface.removeColumn('tenants', 'extra_user_monthly_rate');
    await queryInterface.removeColumn('tenants', 'last_user_billing_date');
  }
};
