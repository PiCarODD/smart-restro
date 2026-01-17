const { User, Tenant, Restaurant, sequelize } = require('../models');
const { Op } = require('sequelize');
const { NotFoundError, ValidationError } = require('../utils/errors');

class UserService {
    /**
     * List all users with filters and pagination
     */
    async listUsers({ page = 1, limit = 20, search, role, tenantId, isActive, sortBy = 'created_at', sortOrder = 'DESC' }) {
        const offset = (page - 1) * limit;

        const where = {};
        
        if (search) {
            where[Op.or] = [
                { email: { [Op.iLike]: `%${search}%` } },
                { firstName: { [Op.iLike]: `%${search}%` } },
                { lastName: { [Op.iLike]: `%${search}%` } }
            ];
        }

        if (role) {
            where.role = role;
        }

        if (tenantId) {
            where.tenantId = tenantId;
        }

        if (isActive !== undefined && isActive !== null) {
            where.isActive = isActive === 'true' || isActive === true;
        }

        const validSortColumns = ['created_at', 'email', 'firstName', 'lastName', 'role'];
        const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
        const validSortOrders = ['ASC', 'DESC'];
        const orderDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

        const { count, rows } = await User.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            attributes: [
                'id', 'email', 'firstName', 'lastName', 'role', 'isActive',
                'tenantId', 'restaurantId', 'created_at', 'updated_at'
            ],
            include: [
                {
                    model: Tenant,
                    as: 'tenant',
                    attributes: ['id', 'name', 'slug'],
                    required: false
                },
                {
                    model: Restaurant,
                    as: 'restaurant',
                    attributes: ['id', 'name'],
                    required: false
                }
            ],
            order: [[sortColumn, orderDirection]]
        });

        return {
            users: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get user by ID
     */
    async getUserById(id) {
        const user = await User.findByPk(id, {
            attributes: { exclude: ['passwordHash'] },
            include: [
                {
                    model: Tenant,
                    as: 'tenant',
                    attributes: ['id', 'name', 'slug']
                },
                {
                    model: Restaurant,
                    as: 'restaurant',
                    attributes: ['id', 'name']
                }
            ]
        });

        if (!user) {
            throw new NotFoundError('User');
        }

        return user;
    }

    /**
     * Update user
     */
    async updateUser(id, updates) {
        const user = await User.findByPk(id);
        if (!user) {
            throw new NotFoundError('User');
        }

        // Prevent updating super_admin
        if (user.role === 'super_admin') {
            throw new ValidationError('Cannot modify super admin user');
        }

        // Allowed fields for SaaS admin update
        const allowedFields = ['isActive', 'role', 'tenantId', 'restaurantId'];
        const updateData = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                // Prevent changing super_admin role
                if (field === 'role' && updates[field] === 'super_admin') {
                    throw new ValidationError('Cannot assign super_admin role');
                }
                updateData[field] = updates[field];
            }
        }

        await user.update(updateData);
        return user;
    }

    /**
     * Bulk update user status
     */
    async bulkUpdateStatus(userIds, isActive) {
        const transaction = await sequelize.transaction();

        try {
            // Check that no super_admins are being modified
            const users = await User.findAll({
                where: { id: { [Op.in]: userIds } },
                transaction
            });

            if (users.length !== userIds.length) {
                throw new ValidationError('Some user IDs not found');
            }

            const superAdmins = users.filter(u => u.role === 'super_admin');
            if (superAdmins.length > 0) {
                throw new ValidationError('Cannot modify super admin users');
            }

            const updated = await User.update(
                { isActive: isActive === true || isActive === 'true' },
                {
                    where: {
                        id: { [Op.in]: userIds },
                        role: { [Op.ne]: 'super_admin' }
                    },
                    transaction
                }
            );

            await transaction.commit();

            return {
                updated: updated[0],
                userIds
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Bulk assign role
     */
    async bulkAssignRole(userIds, role) {
        if (role === 'super_admin') {
            throw new ValidationError('Cannot assign super_admin role via bulk operation');
        }

        const validRoles = [
            'tenant_admin', 'admin', 'manager', 'waiter', 'server',
            'cashier', 'cook', 'kitchen', 'inventory'
        ];

        if (!validRoles.includes(role)) {
            throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
        }

        const transaction = await sequelize.transaction();

        try {
            const users = await User.findAll({
                where: { id: { [Op.in]: userIds } },
                transaction
            });

            if (users.length !== userIds.length) {
                throw new ValidationError('Some user IDs not found');
            }

            const superAdmins = users.filter(u => u.role === 'super_admin');
            if (superAdmins.length > 0) {
                throw new ValidationError('Cannot modify super admin users');
            }

            const updated = await User.update(
                { role },
                {
                    where: {
                        id: { [Op.in]: userIds },
                        role: { [Op.ne]: 'super_admin' }
                    },
                    transaction
                }
            );

            await transaction.commit();

            return {
                updated: updated[0],
                userIds
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Bulk delete users
     */
    async bulkDelete(userIds, softDelete = true) {
        const transaction = await sequelize.transaction();

        try {
            const users = await User.findAll({
                where: { id: { [Op.in]: userIds } },
                transaction
            });

            if (users.length !== userIds.length) {
                throw new ValidationError('Some user IDs not found');
            }

            const superAdmins = users.filter(u => u.role === 'super_admin');
            if (superAdmins.length > 0) {
                throw new ValidationError('Cannot delete super admin users');
            }

            let result;
            if (softDelete) {
                result = await User.update(
                    { isActive: false },
                    {
                        where: {
                            id: { [Op.in]: userIds },
                            role: { [Op.ne]: 'super_admin' }
                        },
                        transaction
                    }
                );
            } else {
                // Hard delete (use with caution)
                result = await User.destroy({
                    where: {
                        id: { [Op.in]: userIds },
                        role: { [Op.ne]: 'super_admin' }
                    },
                    transaction
                });
            }

            await transaction.commit();

            return {
                deleted: softDelete ? result[0] : result,
                userIds
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

module.exports = new UserService();
