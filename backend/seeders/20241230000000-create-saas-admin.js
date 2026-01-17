'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        // 1. Create SaaS Admin Tenant
        const saasTenantSlug = 'saas-system-admin';
        const [existingTenants] = await queryInterface.sequelize.query(
            `SELECT id FROM tenants WHERE slug = '${saasTenantSlug}' LIMIT 1`
        );

        let tenantId;
        if (existingTenants.length > 0) {
            tenantId = existingTenants[0].id;
            console.log('ℹ️  SaaS Admin tenant already exists, using ID:', tenantId);
        } else {
            tenantId = uuidv4();
            await queryInterface.bulkInsert('tenants', [
                {
                    id: tenantId,
                    name: 'SaaS System Admin',
                    slug: saasTenantSlug,
                    subscription_tier: 'enterprise',
                    owner_email: 'superadmin@smartresto.com',
                    subscription_status: 'active',
                    max_restaurants: 9999,
                    max_users: 9999,
                    max_menu_items: 9999,
                    created_at: now,
                    updated_at: now,
                },
            ]);
            console.log('✅ Created SaaS Admin tenant');
        }

        // 2. Create SaaS Admin User
        const adminEmail = 'superadmin@smartresto.com';
        const [existingUsers] = await queryInterface.sequelize.query(
            `SELECT id FROM users WHERE email = '${adminEmail}' LIMIT 1`
        );

        if (existingUsers.length > 0) {
            console.log('ℹ️  SaaS Admin user already exists');
        } else {
            const passwordHash = await bcrypt.hash('admin123', 10);

            await queryInterface.bulkInsert('users', [
                {
                    id: uuidv4(),
                    tenant_id: tenantId,
                    restaurant_id: null,
                    email: adminEmail,
                    password_hash: passwordHash,
                    first_name: 'Super',
                    last_name: 'Admin',
                    role: 'super_admin',
                    is_active: true,
                    created_at: now,
                    updated_at: now,
                }
            ]);
            console.log('✅ Created SaaS Admin user (super_admin)');

            console.log('\n📋 SaaS Admin Credentials:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Admin:');
            console.log(`  Email: ${adminEmail}`);
            console.log('  Password: admin123');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
    },

    async down(queryInterface, Sequelize) {
        const adminEmail = 'superadmin@smartresto.com';
        await queryInterface.bulkDelete('users', { email: adminEmail });
        await queryInterface.bulkDelete('tenants', { slug: 'saas-system-admin' });
    }
};
