const { Tenant, Restaurant, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { NotFoundError } = require('../utils/errors');
const subscriptionService = require('./subscriptionService');

class SaasService {
    /**
     * Get comprehensive SaaS statistics
     */
    async getStats() {
        const [
            totalTenants,
            activeTenants,
            trialTenants,
            totalRestaurants,
            totalUsers,
            subscriptionStats
        ] = await Promise.all([
            Tenant.count(),
            Tenant.count({ where: { subscriptionStatus: 'active' } }),
            Tenant.count({ where: { subscriptionStatus: 'trial' } }),
            Restaurant.count(),
            User.count(),
            subscriptionService.getSubscriptionStats()
        ]);

        return {
            totalTenants,
            activeTenants,
            trialTenants,
            totalRestaurants,
            totalUsers,
            monthlyRevenue: subscriptionStats.mrr,
            byTier: subscriptionStats.byTier,
            byStatus: subscriptionStats.byStatus
        };
    }

    /**
     * Get tenant statistics for a specific tenant
     */
    async getTenantStats(tenantId) {
        const tenant = await Tenant.findByPk(tenantId, {
            include: [
                {
                    model: Restaurant,
                    as: 'restaurants',
                    attributes: ['id']
                },
                {
                    model: User,
                    as: 'users',
                    attributes: ['id', 'isActive']
                }
            ]
        });

        if (!tenant) {
            throw new NotFoundError('Tenant');
        }

        const activeUsers = tenant.users?.filter(u => u.isActive) || [];

        return {
            tenantId: tenant.id,
            tenantName: tenant.name,
            subscriptionTier: tenant.subscriptionTier,
            subscriptionStatus: tenant.subscriptionStatus,
            restaurantCount: tenant.restaurants?.length || 0,
            userCount: tenant.users?.length || 0,
            activeUserCount: activeUsers.length,
            maxRestaurants: tenant.maxRestaurants,
            maxUsers: tenant.maxUsers,
            maxMenuItems: tenant.maxMenuItems,
            utilization: {
                restaurants: ((tenant.restaurants?.length || 0) / tenant.maxRestaurants * 100).toFixed(1),
                users: ((tenant.users?.length || 0) / tenant.maxUsers * 100).toFixed(1)
            }
        };
    }

    /**
     * Get platform-wide analytics
     */
    async getPlatformAnalytics() {
        const stats = await this.getStats();

        // Calculate growth metrics (would need historical data for real implementation)
        const recentTenants = await Tenant.count({
            where: {
                created_at: {
                    [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
            }
        });

        return {
            ...stats,
            recentTenants,
            averageRevenuePerTenant: stats.activeTenants > 0 
                ? (stats.monthlyRevenue / stats.activeTenants).toFixed(2)
                : 0,
            churnRate: 0, // Would calculate from cancelled subscriptions over time
            conversionRate: stats.trialTenants > 0
                ? ((stats.activeTenants / (stats.activeTenants + stats.trialTenants)) * 100).toFixed(2)
                : 0
        };
    }
}

module.exports = new SaasService();
