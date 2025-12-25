const { FeatureToggle } = require('../models');
const { NotFoundError } = require('../utils/errors');

class FeatureToggleController {
  /**
   * List feature toggles for restaurant
   * GET /api/features
   */
  async list(req, res, next) {
    try {
      const where = {
        restaurantId: req.restaurantId // Only from JWT token, never from client
      };

      const toggles = await FeatureToggle.findAll({
        where,
        order: [['created_at', 'DESC']]
      });

      res.json({ toggles });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get feature toggle by ID
   * GET /api/features/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const toggle = await FeatureToggle.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!toggle) {
        throw new NotFoundError('Feature toggle');
      }

      res.json({ toggle });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create or update feature toggle
   * PUT /api/features/:featureKey
   */
  async upsert(req, res, next) {
    try {
      const { featureKey } = req.params;
      const { enabled, config } = req.body;

      const [toggle, created] = await FeatureToggle.findOrCreate({
        where: {
          restaurantId: req.restaurantId,
          featureKey
        },
        defaults: {
          restaurantId: req.restaurantId,
          featureKey,
          enabled: enabled !== undefined ? enabled : false,
          config: config || {}
        }
      });

      if (!created) {
        await toggle.update({
          enabled: enabled !== undefined ? enabled : toggle.enabled,
          config: config !== undefined ? { ...toggle.config, ...config } : toggle.config
        });
      }

      res.json({
        message: created ? 'Feature toggle created' : 'Feature toggle updated',
        toggle
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle feature
   * PATCH /api/features/:id/toggle
   */
  async toggle(req, res, next) {
    try {
      const { id } = req.params;

      const toggle = await FeatureToggle.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!toggle) {
        throw new NotFoundError('Feature toggle');
      }

      await toggle.update({ enabled: !toggle.enabled });

      res.json({
        message: `Feature ${toggle.enabled ? 'enabled' : 'disabled'}`,
        toggle
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete feature toggle
   * DELETE /api/features/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const toggle = await FeatureToggle.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!toggle) {
        throw new NotFoundError('Feature toggle');
      }

      await toggle.destroy();

      res.json({
        message: 'Feature toggle deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeatureToggleController();

