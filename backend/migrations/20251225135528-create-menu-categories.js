'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('menu_categories', {
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
      parent_id: {
        type: Sequelize.UUID,
        references: { model: 'menu_categories', key: 'id' },
        onDelete: 'SET NULL'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      image_url: {
        type: Sequelize.STRING(500)
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      color: {
        type: Sequelize.STRING(20)
      },
      icon: {
        type: Sequelize.STRING(50)
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      available_start_time: {
        type: Sequelize.TIME
      },
      available_end_time: {
        type: Sequelize.TIME
      },
      available_days: {
        type: Sequelize.ARRAY(Sequelize.INTEGER)
      },
      kds_station: {
        type: Sequelize.STRING(100)
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

    await queryInterface.addIndex('menu_categories', ['restaurant_id'], { name: 'idx_menu_categories_restaurant' });
    await queryInterface.addIndex('menu_categories', ['parent_id'], { name: 'idx_menu_categories_parent' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('menu_categories');
  }
};

