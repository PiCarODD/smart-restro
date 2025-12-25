'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feature_toggles', {
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
      feature_key: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      config: {
        type: Sequelize.JSONB,
        defaultValue: {}
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

    await queryInterface.addIndex('feature_toggles', ['restaurant_id'], { name: 'idx_feature_toggles_restaurant' });
    await queryInterface.addConstraint('feature_toggles', {
      fields: ['restaurant_id', 'feature_key'],
      type: 'unique',
      name: 'unique_feature_per_restaurant'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('feature_toggles');
  }
};

