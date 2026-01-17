const tenantService = require('../services/tenantService');
const userService = require('../services/userService');
const subscriptionService = require('../services/subscriptionService');
const saasService = require('../services/saasService');
const userLimitService = require('../services/userLimitService');
const { NotFoundError } = require('../utils/errors');

class SaasController {
    /**
     * List all tenants
     * GET /api/saas/tenants
     */
    async listTenants(req, res, next) {
        try {
            const result = await tenantService.listTenants({
                page: req.query.page,
                limit: req.query.limit,
                search: req.query.search,
                status: req.query.status,
                tier: req.query.tier,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder
            });

            res.json({
                tenants: result.tenants,
                ...result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get tenant details
     * GET /api/saas/tenants/:id
     */
    async getTenant(req, res, next) {
        try {
            const { id } = req.params;
            const includeDetails = req.query.includeDetails === 'true';
            const tenant = await tenantService.getTenantById(id, includeDetails);
            res.json({ tenant });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a new tenant
     * POST /api/saas/tenants
     */
    async createTenant(req, res, next) {
        try {
            const result = await tenantService.createTenant(req.body);
            res.status(201).json({
                message: 'Tenant created successfully',
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update tenant details
     * PUT /api/saas/tenants/:id
     */
    async updateTenant(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const tenant = await tenantService.updateTenant(id, req.body, userId);
            res.json({
                message: 'Tenant updated successfully',
                tenant
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete tenant (soft delete)
     * DELETE /api/saas/tenants/:id
     */
    async deleteTenant(req, res, next) {
        try {
            const { id } = req.params;
            await tenantService.softDeleteTenant(id);
            res.json({
                message: 'Tenant deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Bulk tenant operations
     * POST /api/saas/tenants/bulk
     */
    async bulkTenantOperation(req, res, next) {
        try {
            const { tenantIds, action, value } = req.body;
            const userId = req.user?.id;
            let result;

            switch (action) {
                case 'updateStatus':
                    result = await tenantService.bulkUpdateStatus(tenantIds, value, userId);
                    break;
                case 'updateTier':
                    result = await tenantService.bulkUpdateTier(tenantIds, value);
                    break;
                case 'delete':
                    result = await tenantService.bulkDelete(tenantIds, value !== false);
                    break;
                default:
                    return res.status(400).json({
                        error: 'Invalid action',
                        message: `Action must be one of: updateStatus, updateTier, delete`
                    });
            }

            res.json({
                message: `Bulk operation completed successfully`,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get tenant admin user for impersonation
     * GET /api/saas/tenants/:id/admin
     */
    async getTenantAdmin(req, res, next) {
        try {
            const { id } = req.params;
            const admin = await tenantService.getTenantAdmin(id);
            res.json(admin);
        } catch (error) {
            next(error);
        }
    }

    /**
     * List all users
     * GET /api/saas/users
     */
    async listUsers(req, res, next) {
        try {
            const result = await userService.listUsers({
                page: req.query.page,
                limit: req.query.limit,
                search: req.query.search,
                role: req.query.role,
                tenantId: req.query.tenantId,
                isActive: req.query.isActive,
                sortBy: req.query.sortBy,
                sortOrder: req.query.sortOrder
            });

            res.json({
                users: result.users,
                ...result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user by ID
     * GET /api/saas/users/:id
     */
    async getUser(req, res, next) {
        try {
            const { id } = req.params;
            const user = await userService.getUserById(id);
            res.json({ user });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user (SaaS admin override)
     * PUT /api/saas/users/:id
     */
    async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            const user = await userService.updateUser(id, req.body);
            res.json({
                message: 'User updated successfully',
                user
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Bulk user operations
     * POST /api/saas/users/bulk
     */
    async bulkUserOperation(req, res, next) {
        try {
            const { userIds, action, value } = req.body;
            let result;

            switch (action) {
                case 'updateStatus':
                    result = await userService.bulkUpdateStatus(userIds, value);
                    break;
                case 'assignRole':
                    result = await userService.bulkAssignRole(userIds, value);
                    break;
                case 'delete':
                    result = await userService.bulkDelete(userIds, value !== false);
                    break;
                default:
                    return res.status(400).json({
                        error: 'Invalid action',
                        message: `Action must be one of: updateStatus, assignRole, delete`
                    });
            }

            res.json({
                message: `Bulk operation completed successfully`,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update tenant subscription
     * PUT /api/saas/tenants/:id/subscription
     */
    async updateSubscription(req, res, next) {
        try {
            const { id } = req.params;
            const { subscriptionTier, status } = req.body;
            const result = await subscriptionService.updateSubscription(id, subscriptionTier, { status });
            res.json({
                message: 'Subscription updated successfully',
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Bulk subscription operations
     * POST /api/saas/subscriptions/bulk
     */
    async bulkSubscriptionOperation(req, res, next) {
        try {
            const { tenantIds, action, value } = req.body;
            let result;

            switch (action) {
                case 'updateTier':
                    result = await subscriptionService.bulkUpdateTier(tenantIds, value);
                    break;
                case 'updateStatus':
                    result = await subscriptionService.bulkUpdateStatus(tenantIds, value);
                    break;
                default:
                    return res.status(400).json({
                        error: 'Invalid action',
                        message: `Action must be one of: updateTier, updateStatus`
                    });
            }

            res.json({
                message: `Bulk subscription operation completed successfully`,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get subscription history
     * GET /api/saas/subscriptions/history
     */
    async getSubscriptionHistory(req, res, next) {
        try {
            const { tenantId } = req.query;
            if (!tenantId) {
                return res.status(400).json({
                    error: 'Missing required parameter',
                    message: 'tenantId is required'
                });
            }

            const history = await subscriptionService.getSubscriptionHistory(tenantId, req.query.limit);
            res.json({ history });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get SaaS stats
     * GET /api/saas/stats
     */
    async getStats(req, res, next) {
        try {
            const stats = await saasService.getStats();
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get platform analytics
     * GET /api/saas/analytics
     */
    async getAnalytics(req, res, next) {
        try {
            const analytics = await saasService.getPlatformAnalytics();
            res.json(analytics);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get tenant statistics
     * GET /api/saas/tenants/:id/stats
     */
    async getTenantStats(req, res, next) {
        try {
            const { id } = req.params;
            const stats = await saasService.getTenantStats(id);
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user limit configuration for a tenant
     * GET /api/saas/tenants/:id/user-limits
     */
    async getUserLimits(req, res, next) {
        try {
            const { id } = req.params;
            const limitInfo = await userLimitService.getUserLimitInfo(id);
            res.json({ limitInfo });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update user limit configuration for a tenant
     * PUT /api/saas/tenants/:id/user-limits
     */
    async updateUserLimits(req, res, next) {
        try {
            const { id } = req.params;
            const limitInfo = await userLimitService.updateUserLimitConfig(id, req.body);
            res.json({
                message: 'User limits updated successfully',
                limitInfo
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get user billing history for a tenant
     * GET /api/saas/tenants/:id/user-billing
     */
    async getUserBilling(req, res, next) {
        try {
            const { id } = req.params;
            const limit = parseInt(req.query.limit) || 12;
            const billingHistory = await userLimitService.getBillingHistory(id, limit);
            res.json({ billingHistory });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SaasController();
