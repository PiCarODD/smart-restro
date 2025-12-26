const { Tenant } = require('../models');
const { AuthorizationError } = require('../utils/errors');

/**
 * Middleware to check if a feature is available for the current subscription tier
 * Usage: subscriptionCheck.requireFeature('kds')
 */
class SubscriptionCheck {
  /**
   * Feature to subscription tier mapping
   */
  featureTierMap = {
    kds: 'professional',
    waiter_app: 'professional',
    auto_stock_deduction: 'professional',
    reservations: 'professional',
    multi_location: 'enterprise',
    customer_self_order: 'enterprise',
    api_access: 'enterprise',
  };

  /**
   * Get subscription tier limits
   */
  getLimitsForTier(tier) {
    const limits = {
      starter: {
        maxUsers: 3,
        maxMenuItems: 100,
        maxTables: 15,
      },
      professional: {
        maxUsers: 10,
        maxMenuItems: 500,
        maxTables: 50,
      },
      enterprise: {
        maxUsers: 999999,
        maxMenuItems: 999999,
        maxTables: 999999,
      },
    };
    return limits[tier] || limits.starter;
  }

  /**
   * Check if a tier has access to a feature
   */
  tierHasFeature(tier, feature) {
    const requiredTier = this.featureTierMap[feature];
    if (!requiredTier) return true; // Feature not restricted

    const tierOrder = ['starter', 'professional', 'enterprise'];
    const tierIndex = tierOrder.indexOf(tier);
    const requiredIndex = tierOrder.indexOf(requiredTier);

    return tierIndex >= requiredIndex;
  }

  /**
   * Middleware to require a specific feature
   * Usage: subscriptionCheck.requireFeature('kds')
   */
  requireFeature(feature) {
    return async (req, res, next) => {
      try {
        if (!req.tenantId) {
          return next(new AuthorizationError('Tenant ID not found'));
        }

        const tenant = await Tenant.findByPk(req.tenantId);
        if (!tenant) {
          return next(new AuthorizationError('Tenant not found'));
        }

        const subscriptionTier = tenant.subscriptionTier;

        if (!this.tierHasFeature(subscriptionTier, feature)) {
          return res.status(403).json({
            error: 'Feature not available',
            message: `This feature requires ${this.featureTierMap[feature]} subscription or higher`,
            currentTier: subscriptionTier,
            requiredTier: this.featureTierMap[feature],
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Middleware to check resource limits
   * Usage: subscriptionCheck.checkLimit('maxUsers')
   */
  checkLimit(limitType) {
    return async (req, res, next) => {
      try {
        if (!req.tenantId) {
          return next(new AuthorizationError('Tenant ID not found'));
        }

        const tenant = await Tenant.findByPk(req.tenantId);
        if (!tenant) {
          return next(new AuthorizationError('Tenant not found'));
        }

        const limits = this.getLimitsForTier(tenant.subscriptionTier);
        const limit = limits[limitType];

        if (limit === undefined) {
          return next(); // Limit type not defined, skip check
        }

        // Store limit info in request for controllers to use
        req.subscriptionLimits = limits;
        req.subscriptionTier = tenant.subscriptionTier;

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = new SubscriptionCheck();

