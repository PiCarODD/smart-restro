'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
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
      user_id: {
        type: Sequelize.UUID,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      data: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      read_at: {
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

    await queryInterface.addIndex('notifications', ['restaurant_id'], { name: 'idx_notifications_restaurant' });
    await queryInterface.addIndex('notifications', ['user_id'], { name: 'idx_notifications_user' });
    await queryInterface.addIndex('notifications', ['read'], { name: 'idx_notifications_read' });
    await queryInterface.addIndex('notifications', ['created_at'], { name: 'idx_notifications_created_at' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notifications');
  }
};

