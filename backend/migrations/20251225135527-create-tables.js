'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tables', {
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
      section_id: {
        type: Sequelize.UUID,
        references: { model: 'sections', key: 'id' },
        onDelete: 'SET NULL'
      },
      table_number: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100)
      },
      section: {
        type: Sequelize.STRING(100)
      },
      floor: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 4
      },
      shape: {
        type: Sequelize.STRING(20),
        defaultValue: 'square'
      },
      position_x: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      position_y: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      width: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      height: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      rotation: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: 'available'
      },
      external_token: {
        type: Sequelize.STRING(100),
        unique: true
      },
      qr_code_url: {
        type: Sequelize.STRING(500)
      },
      current_order_id: {
        type: Sequelize.UUID
      },
      occupied_at: {
        type: Sequelize.DATE
      },
      guest_count: {
        type: Sequelize.INTEGER
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

    await queryInterface.addIndex('tables', ['restaurant_id'], { name: 'idx_tables_restaurant' });
    await queryInterface.addIndex('tables', ['status'], { name: 'idx_tables_status' });
    await queryInterface.addIndex('tables', ['external_token'], { name: 'idx_tables_external_token' });
    await queryInterface.addConstraint('tables', {
      fields: ['restaurant_id', 'table_number'],
      type: 'unique',
      name: 'unique_table_number_per_restaurant'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tables');
  }
};

