const { Tenant, User, sequelize } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { Op } = require('sequelize');

class UserLimitService {
    /**
     * Get current user limit information for a tenant
     */
    async getUserLimitInfo(tenantId) {
        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            throw new NotFoundError('Tenant');
        }

        // Count active users
        const userCount = await User.count({
            where: {
                tenantId,
                isActive: true
            }
        });

        // Get configurable limits
        const baseIncludedUsers = tenant.baseIncludedUsers || 10;
        const extraUsersCount = tenant.extraUsersCount || 0;
        const extraUserRate = parseFloat(tenant.extraUserMonthlyRate || 5000);

        // Calculate extra users
        const actualExtraUsers = Math.max(0, userCount - baseIncludedUsers);
        
        // Calculate monthly charge
        const monthlyCharge = actualExtraUsers * extraUserRate;

        return {
            tenantId,
            currentUserCount: userCount,
            baseIncludedUsers,
            extraUsersAllowed: extraUsersCount,
            totalAllowed: baseIncludedUsers + extraUsersCount,
            actualExtraUsers,
            extraUserMonthlyRate: extraUserRate,
            monthlyCharge,
            canCreateMore: userCount < (baseIncludedUsers + extraUsersCount),
            remainingSlots: Math.max(0, (baseIncludedUsers + extraUsersCount) - userCount)
        };
    }

    /**
     * Check if a tenant can create a new user (hard limit check)
     */
    async canCreateUser(tenantId) {
        const limitInfo = await this.getUserLimitInfo(tenantId);
        return {
            canCreate: limitInfo.canCreateMore,
            reason: limitInfo.canCreateMore 
                ? null 
                : `User limit reached. Current: ${limitInfo.currentUserCount}, Limit: ${limitInfo.totalAllowed}`,
            limitInfo
        };
    }

    /**
     * Calculate extra users beyond base
     */
    async calculateExtraUsers(tenantId) {
        const limitInfo = await this.getUserLimitInfo(tenantId);
        return limitInfo.actualExtraUsers;
    }

    /**
     * Calculate monthly user charge
     */
    async calculateMonthlyUserCharge(tenantId) {
        const limitInfo = await this.getUserLimitInfo(tenantId);
        return limitInfo.monthlyCharge;
    }

    /**
     * Update user limit configuration (SaaS admin only)
     */
    async updateUserLimitConfig(tenantId, config) {
        const { baseIncludedUsers, extraUserMonthlyRate } = config;
        
        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            throw new NotFoundError('Tenant');
        }

        // Validate base users
        if (baseIncludedUsers !== undefined) {
            if (baseIncludedUsers < 0) {
                throw new ValidationError('Base included users cannot be negative');
            }

            // Get current user count
            const userCount = await User.count({
                where: { tenantId, isActive: true }
            });

            // Cannot set base users lower than current active users
            if (baseIncludedUsers < userCount) {
                throw new ValidationError(
                    `Base included users (${baseIncludedUsers}) cannot be less than current active users (${userCount})`
                );
            }
        }

        // Validate extra user rate
        if (extraUserMonthlyRate !== undefined) {
            if (extraUserMonthlyRate < 0) {
                throw new ValidationError('Extra user monthly rate cannot be negative');
            }
        }

        // Update tenant
        const updateData = {};
        if (baseIncludedUsers !== undefined) {
            updateData.baseIncludedUsers = baseIncludedUsers;
        }
        if (extraUserMonthlyRate !== undefined) {
            updateData.extraUserMonthlyRate = extraUserMonthlyRate;
        }

        await tenant.update(updateData);

        // Recalculate extra_users_count based on current user count
        const updatedLimitInfo = await this.getUserLimitInfo(tenantId);
        await tenant.update({
            extraUsersCount: updatedLimitInfo.actualExtraUsers
        });

        return await this.getUserLimitInfo(tenantId);
    }

    /**
     * Process monthly user billing
     */
    async processMonthlyUserBilling(tenantId) {
        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            throw new NotFoundError('Tenant');
        }

        const limitInfo = await this.getUserLimitInfo(tenantId);

        // Get current month (YYYY-MM format)
        const now = new Date();
        const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Check if already billed for this month
        const UserBillingRecord = require('../models').UserBillingRecord || require('../models/index').UserBillingRecord;
        if (!UserBillingRecord) {
            throw new Error('UserBillingRecord model not found');
        }
        const existingBilling = await UserBillingRecord.findOne({
            where: {
                tenantId,
                billingMonth
            }
        });

        if (existingBilling) {
            // Already billed this month
            return existingBilling;
        }

        // Calculate charge
        const extraUsers = limitInfo.actualExtraUsers;
        const monthlyCharge = extraUsers * limitInfo.extraUserMonthlyRate;

        // Create billing record
        const billingRecord = await UserBillingRecord.create({
            tenantId,
            billingMonth,
            extraUsersCount: extraUsers,
            ratePerUser: limitInfo.extraUserMonthlyRate,
            totalAmount: monthlyCharge,
            billedAt: now
        });

        // Update tenant's last billing date
        await tenant.update({
            lastUserBillingDate: now,
            extraUsersCount: extraUsers
        });

        return billingRecord;
    }

    /**
     * Get billing history for a tenant
     */
    async getBillingHistory(tenantId, limit = 12) {
        const UserBillingRecord = require('../models').UserBillingRecord || require('../models/index').UserBillingRecord;
        if (!UserBillingRecord) {
            throw new Error('UserBillingRecord model not found');
        }
        const billingRecords = await UserBillingRecord.findAll({
            where: { tenantId },
            order: [['billingMonth', 'DESC']],
            limit
        });

        return billingRecords;
    }
}

module.exports = new UserLimitService();
