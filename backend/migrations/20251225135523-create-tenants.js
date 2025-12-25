'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Enable UUID extension
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryInterface.createTable('tenants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      subscription_tier: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'starter'
      },
      subscription_status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'active'
      },
      subscription_start_date: {
        type: Sequelize.DATE
      },
      subscription_end_date: {
        type: Sequelize.DATE
      },
      stripe_customer_id: {
        type: Sequelize.STRING(255)
      },
      stripe_subscription_id: {
        type: Sequelize.STRING(255)
      },
      max_restaurants: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      max_users: {
        type: Sequelize.INTEGER,
        defaultValue: 3
      },
      max_menu_items: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      owner_email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      billing_email: {
        type: Sequelize.STRING(255)
      },
      phone: {
        type: Sequelize.STRING(50)
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

    await queryInterface.addIndex('tenants', ['slug'], { name: 'idx_tenants_slug' });
    await queryInterface.addIndex('tenants', ['stripe_customer_id'], { name: 'idx_tenants_stripe_customer' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tenants');
  }
};
