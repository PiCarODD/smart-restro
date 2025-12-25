'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
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
      user_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.STRING(100)
      },
      entity_id: {
        type: Sequelize.UUID
      },
      changes: {
        type: Sequelize.JSONB
      },
      metadata: {
        type: Sequelize.JSONB
      },
      ip_address: {
        type: Sequelize.STRING(50)
      },
      user_agent: {
        type: Sequelize.TEXT
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('audit_logs', ['tenant_id'], { name: 'idx_audit_logs_tenant' });
    await queryInterface.addIndex('audit_logs', ['restaurant_id'], { name: 'idx_audit_logs_restaurant' });
    await queryInterface.addIndex('audit_logs', ['user_id'], { name: 'idx_audit_logs_user' });
    await queryInterface.addIndex('audit_logs', ['action'], { name: 'idx_audit_logs_action' });
    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id'], { name: 'idx_audit_logs_entity' });
    await queryInterface.addIndex('audit_logs', ['created_at'], { name: 'idx_audit_logs_created' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_logs');
  }
};

