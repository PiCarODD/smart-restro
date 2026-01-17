const { Tenant, Restaurant, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { NotFoundError, ValidationError } = require('../utils/errors');
const bcrypt = require('bcryptjs');
const auditLogger = require('../utils/auditLogger');

class TenantService {
    /**
     * Get tier limits
     */
    getTierLimits(tier) {
        const limits = {
            starter: { maxUsers: 3, maxMenuItems: 100, maxRestaurants: 1 },
            professional: { maxUsers: 10, maxMenuItems: 500, maxRestaurants: 1 },
            enterprise: { maxUsers: 999999, maxMenuItems: 999999, maxRestaurants: 999999 }
        };
        return limits[tier] || limits.starter;
    }

    /**
     * List tenants with filters and pagination
     */
    async listTenants({ page = 1, limit = 10, search, status, tier, sortBy = 'created_at', sortOrder = 'DESC' }) {
        const offset = (page - 1) * limit;

        const where = {};
        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { ownerEmail: { [Op.iLike]: `%${search}%` } },
                { slug: { [Op.iLike]: `%${search}%` } }
            ];
        }
        if (status) {
            where.subscriptionStatus = status;
        }
        if (tier) {
            where.subscriptionTier = tier;
        }

        const validSortColumns = ['created_at', 'name', 'subscriptionTier', 'subscriptionStatus'];
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
        const validSortOrders = ['ASC', 'DESC'];
        const orderDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        const { count, rows } = await Tenant.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true,
            order: [[sortColumn, orderDirection]],
            include: [
                {
                    model: Restaurant,
                    as: 'restaurants',
                    attributes: ['id', 'name'],
                    required: false
                },
                {
                    model: User,
                    as: 'users',
                    attributes: ['id'],
                    required: false
                }
            ]
        });

        // Add computed fields
        const tenants = rows.map(tenant => ({
            ...tenant.toJSON(),
            restaurantCount: tenant.restaurants?.length || 0,
            userCount: tenant.users?.length || 0
        }));

        return {
            tenants,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get tenant by ID with full details
     */
    async getTenantById(id, includeDetails = false) {
        const include = [
            {
                model: Restaurant,
                as: 'restaurants',
                attributes: ['id', 'name', 'slug', 'created_at']
            }
        ];

        if (includeDetails) {
            include.push({
                model: User,
                as: 'users',
                attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'created_at']
            });
        }

        const tenant = await Tenant.findByPk(id, { include });

        if (!tenant) {
            throw new NotFoundError('Tenant');
        }

        return tenant;
    }

    /**
     * Get tenant admin user for impersonation
     */
    async getTenantAdmin(tenantId) {
        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            throw new NotFoundError('Tenant');
        }

        const adminUser = await User.findOne({
            where: {
                tenantId,
                role: 'tenant_admin',
                isActive: true
            }
        });

        if (!adminUser) {
            throw new NotFoundError('No active tenant admin found for this tenant');
        }

        return {
            userId: adminUser.id,
            email: adminUser.email,
            name: `${adminUser.firstName} ${adminUser.lastName}`
        };
    }

    /**
     * Create a new tenant with owner user
     */
    async createTenant({ name, slug, ownerEmail, ownerFirstName, ownerLastName, password, subscriptionTier = 'starter', phone, billingEmail }) {
        const transaction = await sequelize.transaction();

        try {
            // Validate slug uniqueness
            const existingTenant = await Tenant.findOne({ where: { slug }, transaction });
            if (existingTenant) {
                throw new ValidationError('Tenant ID (slug) already exists');
            }

            // Validate email uniqueness
            const existingUser = await User.findOne({ where: { email: ownerEmail }, transaction });
            if (existingUser) {
                throw new ValidationError('User with this email already exists');
            }

            // Get limits for tier
            const limits = this.getTierLimits(subscriptionTier);

            // Create tenant
            const tenant = await Tenant.create({
                name,
                slug,
                ownerEmail,
                subscriptionTier,
                subscriptionStatus: 'active',
                subscriptionStartDate: new Date(),
                maxRestaurants: limits.maxRestaurants,
                maxUsers: limits.maxUsers,
                maxMenuItems: limits.maxMenuItems,
                phone,
                billingEmail: billingEmail || ownerEmail
            }, { transaction });

            // Create owner user
            const passwordHash = await bcrypt.hash(password, 10);
            const user = await User.create({
                tenantId: tenant.id,
                email: ownerEmail,
                passwordHash,
                firstName: ownerFirstName,
                lastName: ownerLastName,
                role: 'tenant_admin',
                isActive: true
            }, { transaction });

            await transaction.commit();

            // Log audit
            await auditLogger.logTenantCreation(user.id, tenant.id, {
                name: tenant.name,
                slug: tenant.slug,
                subscriptionTier: tenant.subscriptionTier,
                subscriptionStatus: tenant.subscriptionStatus
            });

            return {
                tenant,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                }
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Update tenant details
     */
    async updateTenant(id, updates, userId) {
        const tenant = await Tenant.findByPk(id);
        if (!tenant) {
            throw new NotFoundError('Tenant');
        }

        const before = { ...tenant.toJSON() };

        // Allowed fields for update
        const allowedFields = ['name', 'ownerEmail', 'phone', 'billingEmail'];
        const updateData = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                updateData[field] = updates[field];
            }
        }

        await tenant.update(updateData);
        
        // Log audit
        if (userId) {
            await auditLogger.logTenantUpdate(userId, id, before, tenant.toJSON());
        }

        return tenant;
    }

    /**
     * Soft delete tenant (set status to cancelled)
     */
    async softDeleteTenant(id) {
        const tenant = await Tenant.findByPk(id);
        if (!tenant) {
            throw new NotFoundError('Tenant');
        }

        await tenant.update({
            subscriptionStatus: 'cancelled',
            subscriptionEndDate: new Date()
        });

        return tenant;
    }

    /**
     * Bulk update tenant status
     */
    async bulkUpdateStatus(tenantIds, status, userId) {
        const validStatuses = ['active', 'trial', 'past_due', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        const transaction = await sequelize.transaction();

        try {
            const tenants = await Tenant.findAll({
                where: { id: { [Op.in]: tenantIds } },
                transaction
            });

            if (tenants.length !== tenantIds.length) {
                throw new ValidationError('Some tenant IDs not found');
            }

            const updated = await Tenant.update(
                { subscriptionStatus: status },
                {
                    where: { id: { [Op.in]: tenantIds } },
                    transaction
                }
            );

            await transaction.commit();

            return {
                updated: updated[0],
                tenantIds
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Bulk update tenant tier
     */
    async bulkUpdateTier(tenantIds, tier) {
        const validTiers = ['starter', 'professional', 'enterprise'];
        if (!validTiers.includes(tier)) {
            throw new ValidationError(`Invalid tier. Must be one of: ${validTiers.join(', ')}`);
        }

        const limits = this.getTierLimits(tier);
        const transaction = await sequelize.transaction();

        try {
            const tenants = await Tenant.findAll({
                where: { id: { [Op.in]: tenantIds } },
                transaction
            });

            if (tenants.length !== tenantIds.length) {
                throw new ValidationError('Some tenant IDs not found');
            }

            const updated = await Tenant.update(
                {
                    subscriptionTier: tier,
                    maxUsers: limits.maxUsers,
                    maxMenuItems: limits.maxMenuItems,
                    maxRestaurants: limits.maxRestaurants
                },
                {
                    where: { id: { [Op.in]: tenantIds } },
                    transaction
                }
            );

            await transaction.commit();

            return {
                updated: updated[0],
                tenantIds
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Bulk delete tenants (soft delete)
     */
    async bulkDelete(tenantIds, softDelete = true) {
        const transaction = await sequelize.transaction();

        try {
            const tenants = await Tenant.findAll({
                where: { id: { [Op.in]: tenantIds } },
                transaction
            });

            if (tenants.length !== tenantIds.length) {
                throw new ValidationError('Some tenant IDs not found');
            }

            let result;
            if (softDelete) {
                result = await Tenant.update(
                    {
                        subscriptionStatus: 'cancelled',
                        subscriptionEndDate: new Date()
                    },
                    {
                        where: { id: { [Op.in]: tenantIds } },
                        transaction
                    }
                );
            } else {
                // Hard delete (use with caution)
                result = await Tenant.destroy({
                    where: { id: { [Op.in]: tenantIds } },
                    transaction
                });
            }

            await transaction.commit();

            return {
                deleted: softDelete ? result[0] : result,
                tenantIds
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Check tenant limits before operations
     */
    async checkLimits(tenantId, resource, count = 1) {
        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            throw new NotFoundError('Tenant');
        }

        const limits = {
            users: tenant.maxUsers,
            menuItems: tenant.maxMenuItems,
            restaurants: tenant.maxRestaurants
        };

        const current = {
            users: await User.count({ where: { tenantId } }),
            restaurants: await Restaurant.count({ where: { tenantId } }),
            menuItems: 0 // Would need MenuItem model count
        };

        if (limits[resource] && current[resource] + count > limits[resource]) {
            throw new ValidationError(`Tenant has reached the limit for ${resource}. Current: ${current[resource]}, Limit: ${limits[resource]}`);
        }

        return true;
    }
}

module.exports = new TenantService();
