'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
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
      restaurant_id: {
        type: Sequelize.UUID,
        references: { model: 'restaurants', key: 'id' },
        onDelete: 'SET NULL'
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(50)
      },
      avatar_url: {
        type: Sequelize.STRING(500)
      },
      role: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'waiter'
      },
      pin_code: {
        type: Sequelize.STRING(10)
      },
      assigned_sections: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: []
      },
      two_factor_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      two_factor_secret: {
        type: Sequelize.STRING(255)
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_login_at: {
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

    await queryInterface.addIndex('users', ['tenant_id'], { name: 'idx_users_tenant' });
    await queryInterface.addIndex('users', ['restaurant_id'], { name: 'idx_users_restaurant' });
    await queryInterface.addIndex('users', ['email'], { name: 'idx_users_email' });
    await queryInterface.addIndex('users', ['role'], { name: 'idx_users_role' });
    await queryInterface.addConstraint('users', {
      fields: ['tenant_id', 'email'],
      type: 'unique',
      name: 'unique_user_email_per_tenant'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};

