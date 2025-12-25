'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('restaurants', {
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
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      address_line1: {
        type: Sequelize.STRING(255)
      },
      address_line2: {
        type: Sequelize.STRING(255)
      },
      city: {
        type: Sequelize.STRING(100)
      },
      state: {
        type: Sequelize.STRING(100)
      },
      postal_code: {
        type: Sequelize.STRING(20)
      },
      country: {
        type: Sequelize.STRING(100),
        defaultValue: 'USA'
      },
      phone: {
        type: Sequelize.STRING(50)
      },
      email: {
        type: Sequelize.STRING(255)
      },
      website: {
        type: Sequelize.STRING(255)
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {
          features: {
            kds: { enabled: false },
            waiterApp: { enabled: false },
            inventory: { enabled: true, autoDeduction: false },
            reservations: { enabled: false },
            selfOrdering: { enabled: false },
            loyalty: { enabled: false }
          },
          operations: {
            taxRate: 8.0,
            serviceCharge: 0,
            currency: 'USD',
            timezone: 'America/New_York'
          },
          ui: {
            theme: 'light',
            primaryColor: '#1976d2'
          }
        }
      },
      logo_url: {
        type: Sequelize.STRING(500)
      },
      cover_image_url: {
        type: Sequelize.STRING(500)
      },
      is_active: {
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

    await queryInterface.addIndex('restaurants', ['tenant_id'], { name: 'idx_restaurants_tenant' });
    await queryInterface.addIndex('restaurants', ['settings'], { name: 'idx_restaurants_settings', using: 'GIN' });
    await queryInterface.addConstraint('restaurants', {
      fields: ['tenant_id', 'slug'],
      type: 'unique',
      name: 'unique_restaurant_slug_per_tenant'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('restaurants');
  }
};

