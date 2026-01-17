const { AuditLog } = require('../models');

/**
 * Audit Logger Utility
 * Logs all admin actions for compliance and tracking
 */
class AuditLogger {
    /**
     * Log an admin action
     */
    async log({
        userId,
        tenantId = null,
        restaurantId = null,
        action,
        entityType,
        entityId,
        changes = {},
        metadata = {},
        ipAddress = null,
        userAgent = null
    }) {
        try {
            // For SaaS admin actions, use a special tenant ID or the target tenant ID
            const logTenantId = tenantId || entityId || userId; // Fallback for SaaS admin actions
            
            await AuditLog.create({
                userId,
                tenantId: logTenantId, // Required field - use entity or fallback
                restaurantId,
                action,
                entityType,
                entityId,
                changes,
                metadata: {
                    ...metadata,
                    ipAddress,
                    userAgent
                }
            });
        } catch (error) {
            // Log error but don't throw - audit logging should not break main functionality
            console.error('Failed to create audit log:', error);
        }
    }

    /**
     * Log tenant creation
     */
    async logTenantCreation(userId, tenantId, tenantData) {
        await this.log({
            userId,
            tenantId,
            action: 'tenant_created',
            entityType: 'tenant',
            entityId: tenantId,
            changes: {
                tenantName: tenantData.name,
                subscriptionTier: tenantData.subscriptionTier,
                subscriptionStatus: tenantData.subscriptionStatus
            },
            metadata: {
                created: true
            }
        });
    }

    /**
     * Log tenant update
     */
    async logTenantUpdate(userId, tenantId, before, after) {
        const changedFields = Object.keys(after).filter(key => before[key] !== after[key]);
        const changes = {};
        changedFields.forEach(field => {
            changes[field] = {
                before: before[field],
                after: after[field]
            };
        });

        await this.log({
            userId,
            tenantId,
            action: 'tenant_updated',
            entityType: 'tenant',
            entityId: tenantId,
            changes,
            metadata: {
                changedFields
            }
        });
    }

    /**
     * Log tenant deletion
     */
    async logTenantDeletion(userId, tenantId, tenantData) {
        await this.log({
            userId,
            tenantId,
            action: 'tenant_deleted',
            entityType: 'tenant',
            entityId: tenantId,
            changes: {
                deleted: true,
                tenantName: tenantData.name,
                subscriptionStatus: tenantData.subscriptionStatus
            },
            metadata: {}
        });
    }

    /**
     * Log bulk tenant operation
     */
    async logBulkTenantOperation(userId, action, tenantIds, details) {
        await this.log({
            userId,
            tenantId: tenantIds[0] || userId, // Use first tenant or fallback
            action: `bulk_tenant_${action}`,
            entityType: 'tenant',
            entityId: null,
            changes: details,
            metadata: {
                tenantIds,
                count: tenantIds.length,
                bulkOperation: true
            }
        });
    }

    /**
     * Log subscription update
     */
    async logSubscriptionUpdate(userId, tenantId, before, after) {
        await this.log({
            userId,
            tenantId,
            action: 'subscription_updated',
            entityType: 'subscription',
            entityId: tenantId,
            changes: {
                subscriptionTier: {
                    before: before.subscriptionTier,
                    after: after.subscriptionTier
                },
                subscriptionStatus: {
                    before: before.subscriptionStatus,
                    after: after.subscriptionStatus
                }
            },
            metadata: {
                previousTier: before.subscriptionTier,
                newTier: after.subscriptionTier,
                previousStatus: before.subscriptionStatus,
                newStatus: after.subscriptionStatus
            }
        });
    }

    /**
     * Log bulk subscription operation
     */
    async logBulkSubscriptionOperation(userId, action, tenantIds, value) {
        await this.log({
            userId,
            tenantId: tenantIds[0] || userId,
            action: `bulk_subscription_${action}`,
            entityType: 'subscription',
            entityId: null,
            changes: {
                [action]: value
            },
            metadata: {
                tenantIds,
                count: tenantIds.length,
                bulkOperation: true
            }
        });
    }

    /**
     * Log user update
     */
    async logUserUpdate(userId, targetUserId, targetTenantId, before, after) {
        const changedFields = Object.keys(after).filter(key => before[key] !== after[key]);
        const changes = {};
        changedFields.forEach(field => {
            changes[field] = {
                before: before[field],
                after: after[field]
            };
        });

        await this.log({
            userId,
            tenantId: targetTenantId || userId,
            action: 'user_updated',
            entityType: 'user',
            entityId: targetUserId,
            changes,
            metadata: {
                changedFields
            }
        });
    }

    /**
     * Log bulk user operation
     */
    async logBulkUserOperation(userId, action, userIds, details) {
        await this.log({
            userId,
            tenantId: userId, // Use admin user's ID as fallback
            action: `bulk_user_${action}`,
            entityType: 'user',
            entityId: null,
            changes: details,
            metadata: {
                userIds,
                count: userIds.length,
                bulkOperation: true
            }
        });
    }

    /**
     * Get audit logs with filters
     */
    async getAuditLogs({
        userId = null,
        tenantId = null,
        entityType = null,
        entityId = null,
        action = null,
        limit = 100,
        offset = 0
    }) {
        const where = {};
        if (userId) where.userId = userId;
        if (tenantId) where.tenantId = tenantId;
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;
        if (action) where.action = action;

        const { count, rows } = await AuditLog.findAndCountAll({
            where,
            limit,
            offset,
            order: [['created_at', 'DESC']],
            include: [
                { model: require('../models').User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
                { model: require('../models').Tenant, as: 'tenant', attributes: ['id', 'name'], required: false }
            ]
        });

        return {
            logs: rows.map(log => ({
                ...log.toJSON(),
                changes: log.changes || {},
                metadata: log.metadata || {}
            })),
            total: count
        };
    }
}

module.exports = new AuditLogger();
