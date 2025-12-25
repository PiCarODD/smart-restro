'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('menu_items', {
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
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'menu_categories', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      short_description: {
        type: Sequelize.STRING(500)
      },
      base_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      cost_price: {
        type: Sequelize.DECIMAL(10, 2)
      },
      variants: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      modifiers: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      image_url: {
        type: Sequelize.STRING(500)
      },
      images: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      calories: {
        type: Sequelize.INTEGER
      },
      allergens: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: []
      },
      dietary_tags: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: []
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_new: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_available: {
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
      prep_time_minutes: {
        type: Sequelize.INTEGER
      },
      kds_station: {
        type: Sequelize.STRING(100)
      },
      track_inventory: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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

    await queryInterface.addIndex('menu_items', ['restaurant_id'], { name: 'idx_menu_items_restaurant' });
    await queryInterface.addIndex('menu_items', ['category_id'], { name: 'idx_menu_items_category' });
    await queryInterface.addIndex('menu_items', ['is_active', 'is_available'], { name: 'idx_menu_items_active' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('menu_items');
  }
};

