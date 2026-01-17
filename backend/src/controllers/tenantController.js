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

}

module.exports = new TenantController();

