'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { v4: uuidv4 } = require('uuid');
    const now = new Date();

    // Check if tenant already exists
    const [existingTenants] = await queryInterface.sequelize.query(
      "SELECT id FROM tenants WHERE slug = 'demo-restaurant-group' LIMIT 1"
    );

    let tenantId;
    if (existingTenants.length > 0) {
      tenantId = existingTenants[0].id;
      console.log('ℹ️  Demo tenant already exists, using existing tenant ID:', tenantId);
    } else {
      // Create Demo Tenant
      tenantId = uuidv4();
      await queryInterface.bulkInsert('tenants', [
        {
          id: tenantId,
          name: 'Demo Restaurant Group',
          slug: 'demo-restaurant-group',
          subscription_tier: 'professional',
          owner_email: 'admin@demo.com',
          created_at: now,
          updated_at: now,
        },
      ]);
      console.log('✅ Created demo tenant');
    }

    // Check if restaurant already exists
    const [existingRestaurants] = await queryInterface.sequelize.query(
      "SELECT id FROM restaurants WHERE slug = 'smart-resto-downtown' LIMIT 1"
    );

    let restaurantId;
    if (existingRestaurants.length > 0) {
      restaurantId = existingRestaurants[0].id;
      console.log('ℹ️  Demo restaurant already exists, using existing restaurant ID:', restaurantId);
    } else {
      // Create Demo Restaurant
      restaurantId = uuidv4();
      await queryInterface.bulkInsert('restaurants', [
        {
          id: restaurantId,
          tenant_id: tenantId,
          name: 'Smart Resto - Downtown',
          slug: 'smart-resto-downtown',
        settings: JSON.stringify({
          features: {
            kds: { enabled: true },
            waiterApp: { enabled: true },
            inventory: { enabled: true, autoDeduction: true },
            reservations: { enabled: false },
            selfOrdering: { enabled: false },
            loyalty: { enabled: false },
          },
          operations: {
            taxRate: 8.0,
            serviceCharge: 10.0,
            currency: 'USD',
            timezone: 'America/New_York',
          },
          ui: {
            theme: 'light',
            primaryColor: '#1976d2',
          },
        }),
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      ]);
      console.log('✅ Created demo restaurant');
    }

    // Hash passwords
    const defaultPassword = await bcrypt.hash('password123', 10);

    // Create Users
    const users = [
      {
        id: uuidv4(),
        tenant_id: tenantId,
        restaurant_id: restaurantId,
        email: 'admin@demo.com',
        password_hash: defaultPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        pin_code: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        tenant_id: tenantId,
        restaurant_id: restaurantId,
        email: 'manager@demo.com',
        password_hash: defaultPassword,
        first_name: 'Manager',
        last_name: 'User',
        role: 'manager',
        pin_code: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        tenant_id: tenantId,
        restaurant_id: restaurantId,
        email: 'cashier@demo.com',
        password_hash: defaultPassword,
        first_name: 'Cashier',
        last_name: 'User',
        role: 'cashier',
        pin_code: '1111',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        tenant_id: tenantId,
        restaurant_id: restaurantId,
        email: 'waiter@demo.com',
        password_hash: defaultPassword, // Use default password for consistency
        first_name: 'Waiter',
        last_name: 'One',
        role: 'waiter',
        pin_code: '1234',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        tenant_id: tenantId,
        restaurant_id: restaurantId,
        email: 'server@demo.com',
        password_hash: defaultPassword,
        first_name: 'Server',
        last_name: 'Two',
        role: 'server',
        pin_code: '5678',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        tenant_id: tenantId,
        restaurant_id: restaurantId,
        email: 'kitchen@demo.com',
        password_hash: defaultPassword,
        first_name: 'Kitchen',
        last_name: 'Staff',
        role: 'kitchen',
        pin_code: '9999',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        tenant_id: tenantId,
        restaurant_id: restaurantId,
        email: 'inventory@demo.com',
        password_hash: defaultPassword,
        first_name: 'Inventory',
        last_name: 'Manager',
        role: 'inventory',
        pin_code: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ];

    // Check which users already exist and only insert new ones
    const [existingUsers] = await queryInterface.sequelize.query(
      "SELECT email FROM users WHERE email IN ('admin@demo.com', 'manager@demo.com', 'cashier@demo.com', 'waiter@demo.com', 'server@demo.com', 'kitchen@demo.com', 'inventory@demo.com')"
    );

    const existingEmails = existingUsers.map(u => u.email);
    const newUsers = users.filter(u => !existingEmails.includes(u.email));

    if (newUsers.length > 0) {
      await queryInterface.bulkInsert('users', newUsers);
      console.log(`✅ Created ${newUsers.length} new user(s)`);
    } else {
      console.log('ℹ️  All demo users already exist');
    }

    console.log('\n✅ Seeded demo tenant and users successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('  Email: admin@demo.com');
    console.log('  Password: password123');
    console.log('\nManager:');
    console.log('  Email: manager@demo.com');
    console.log('  Password: password123');
    console.log('\nCashier:');
    console.log('  Email: cashier@demo.com');
    console.log('  Password: password123');
    console.log('  PIN: 1111');
    console.log('\nWaiter:');
    console.log('  Email: waiter@demo.com');
    console.log('  Password: password123');
    console.log('  PIN: 1234');
    console.log('\nServer:');
    console.log('  Email: server@demo.com');
    console.log('  Password: password123');
    console.log('  PIN: 5678');
    console.log('\nKitchen:');
    console.log('  Email: kitchen@demo.com');
    console.log('  Password: password123');
    console.log('  PIN: 9999');
    console.log('\nInventory:');
    console.log('  Email: inventory@demo.com');
    console.log('  Password: password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: [
          'admin@demo.com',
          'manager@demo.com',
          'cashier@demo.com',
          'waiter@demo.com',
          'server@demo.com',
          'kitchen@demo.com',
          'inventory@demo.com',
        ],
      },
    });

    await queryInterface.bulkDelete('restaurants', {
      slug: 'smart-resto-downtown',
    });

    await queryInterface.bulkDelete('tenants', {
      slug: 'demo-restaurant-group',
    });
  },
};

