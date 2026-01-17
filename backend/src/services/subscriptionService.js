const { Tenant, sequelize } = require('../models');
const { Op } = require('sequelize');
const { NotFoundError, ValidationError } = require('../utils/errors');
const tenantService = require('./tenantService');

class SubscriptionService {
    /**
     * Update tenant subscription tier
     */
    async updateSubscription(tenantId, subscriptionTier, options = {}) {
        const validTiers = ['starter', 'professional', 'enterprise'];
        if (!validTiers.includes(subscriptionTier)) {
            throw new ValidationError(`Invalid subscription tier. Must be one of: ${validTiers.join(', ')}`);
        }

        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            throw new NotFoundError('Tenant');
        }

        const limits = tenantService.getTierLimits(subscriptionTier);
        const previousTier = tenant.subscriptionTier;

        const updateData = {
            subscriptionTier,
            maxUsers: limits.maxUsers,
            maxMenuItems: limits.maxMenuItems,
            maxRestaurants: limits.maxRestaurants
        };

        // If updating to active status, set start date if not set
        if (options.status === 'active' && !tenant.subscriptionStartDate) {
            updateData.subscriptionStartDate = new Date();
        }

        // If updating status
        if (options.status) {
            const validStatuses = ['active', 'trial', 'past_due', 'cancelled'];
            if (validStatuses.includes(options.status)) {
                updateData.subscriptionStatus = options.status;
                
                if (options.status === 'cancelled') {
                    updateData.subscriptionEndDate = new Date();
                }
            }
        }

        await tenant.update(updateData);

        return {
            tenant,
            previousTier,
            newTier: subscriptionTier,
            changed: previousTier !== subscriptionTier
        };
    }

    /**
     * Bulk update subscription tier
     */
    async bulkUpdateTier(tenantIds, subscriptionTier) {
        const validTiers = ['starter', 'professional', 'enterprise'];
        if (!validTiers.includes(subscriptionTier)) {
            throw new ValidationError(`Invalid subscription tier. Must be one of: ${validTiers.join(', ')}`);
        }

        const limits = tenantService.getTierLimits(subscriptionTier);
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
                    subscriptionTier,
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
     * Bulk update subscription status
     */
    async bulkUpdateStatus(tenantIds, status) {
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

            const updateData = { subscriptionStatus: status };
            
            // Set end date if cancelling
            if (status === 'cancelled') {
                updateData.subscriptionEndDate = new Date();
            }

            // Set start date if activating and not set
            if (status === 'active') {
                // This will be handled per tenant if needed
            }

            const updated = await Tenant.update(
                updateData,
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
     * Get subscription change history
     * Note: This would ideally use an audit log table. For now, we'll return recent changes.
     */
    async getSubscriptionHistory(tenantId, limit = 50) {
        // This would query an audit log table in a real implementation
        // For now, return empty array - to be implemented with audit logging
        return [];
    }

    /**
     * Calculate monthly recurring revenue
     */
    async calculateMRR() {
        const pricing = {
            starter: 49,
            professional: 129,
            enterprise: 299
        };

        const tenants = await Tenant.findAll({
            where: {
                subscriptionStatus: {
                    [Op.in]: ['active', 'trial']
                }
            },
            attributes: ['subscriptionTier']
        });

        let mrr = 0;
        tenants.forEach(tenant => {
            mrr += pricing[tenant.subscriptionTier] || 0;
        });

        return mrr;
    }

    /**
     * Get subscription statistics
     */
    async getSubscriptionStats() {
        const stats = {
            byTier: {
                starter: 0,
                professional: 0,
                enterprise: 0
            },
            byStatus: {
                active: 0,
                trial: 0,
                past_due: 0,
                cancelled: 0
            },
            mrr: 0
        };

        const tenantsByTier = await Tenant.findAll({
            attributes: ['subscriptionTier', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['subscriptionTier'],
            raw: true
        });

        tenantsByTier.forEach(t => {
            if (stats.byTier[t.subscriptionTier] !== undefined) {
                stats.byTier[t.subscriptionTier] = parseInt(t.count);
            }
        });

        const tenantsByStatus = await Tenant.findAll({
            attributes: ['subscriptionStatus', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            group: ['subscriptionStatus'],
            raw: true
        });

        tenantsByStatus.forEach(t => {
            if (stats.byStatus[t.subscriptionStatus] !== undefined) {
                stats.byStatus[t.subscriptionStatus] = parseInt(t.count);
            }
        });

        stats.mrr = await this.calculateMRR();

        return stats;
    }
}

module.exports = new SubscriptionService();
