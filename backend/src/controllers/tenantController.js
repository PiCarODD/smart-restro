const { Tenant } = require('../models');
const { NotFoundError, AuthorizationError, ValidationError } = require('../utils/errors');

/**
 * Get limits for subscription tier
 */
function getLimitsForTier(tier) {
  const limits = {
    starter: {
      maxUsers: 3,
      maxMenuItems: 100,
      maxRestaurants: 1,
    },
    professional: {
      maxUsers: 10,
      maxMenuItems: 500,
      maxRestaurants: 1,
    },
    enterprise: {
      maxUsers: 999999, // Effectively unlimited
      maxMenuItems: 999999,
      maxRestaurants: 999999,
    },
  };

  return limits[tier] || limits.starter;
}

class TenantController {
  /**
   * Get current user's tenant
   * GET /api/tenant/me
   */
  async getCurrent(req, res, next) {
    try {
      if (!req.tenantId) {
        throw new NotFoundError('Tenant');
      }

      const tenant = await Tenant.findOne({
        where: { id: req.tenantId }
      });

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      res.json({ tenant });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user's tenant subscription tier
   * PUT /api/tenant/me/subscription
   * Only allowed for tenant_admin or super_admin
   */
  async updateSubscription(req, res, next) {
    try {
      if (!req.tenantId) {
        throw new NotFoundError('Tenant');
      }

      // Only tenant_admin, super_admin, or admin can change subscription tier
      if (!['tenant_admin', 'super_admin', 'admin'].includes(req.user.role)) {
        throw new AuthorizationError('Only admins can update subscription tier');
      }

      const { subscriptionTier } = req.body;

      // Validate subscription tier
      const validTiers = ['starter', 'professional', 'enterprise'];
      if (!validTiers.includes(subscriptionTier)) {
        throw new ValidationError('Invalid subscription tier. Must be one of: starter, professional, enterprise');
      }

      const tenant = await Tenant.findOne({
        where: { id: req.tenantId }
      });

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      // Update subscription tier and adjust limits based on tier
      const limits = getLimitsForTier(subscriptionTier);
      
      await tenant.update({
        subscriptionTier,
        maxUsers: limits.maxUsers,
        maxMenuItems: limits.maxMenuItems,
        maxRestaurants: limits.maxRestaurants,
      });

      // Reload to get updated data
      await tenant.reload();

      res.json({
        message: 'Subscription tier updated successfully',
        tenant
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TenantController();

