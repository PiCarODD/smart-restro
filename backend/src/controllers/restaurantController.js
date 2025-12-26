const { Restaurant } = require('../models');
const { NotFoundError, AuthorizationError } = require('../utils/errors');

class RestaurantController {
  /**
   * Get current user's restaurant (from JWT token)
   * GET /api/restaurants/me
   */
  async getCurrent(req, res, next) {
    try {
      if (!req.restaurantId) {
        throw new NotFoundError('Restaurant');
      }

      const restaurant = await Restaurant.findOne({
        where: { id: req.restaurantId, tenantId: req.tenantId },
        include: [
          { model: require('../models').Tenant, as: 'tenant', attributes: ['id', 'name', 'slug', 'subscriptionTier', 'subscriptionStatus'] }
        ]
      });

      if (!restaurant) {
        throw new NotFoundError('Restaurant');
      }

      // Include subscription tier in response
      const restaurantData = restaurant.toJSON();
      if (restaurantData.tenant) {
        restaurantData.subscriptionTier = restaurantData.tenant.subscriptionTier;
        restaurantData.subscriptionStatus = restaurantData.tenant.subscriptionStatus;
      }

      res.json({ restaurant: restaurantData });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user's restaurant (from JWT token)
   * PUT /api/restaurants/me
   */
  async updateCurrent(req, res, next) {
    try {
      if (!req.restaurantId) {
        throw new NotFoundError('Restaurant');
      }

      const {
        name,
        slug,
        description,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        phone,
        email,
        website,
        timezone,
        currency,
        isActive
      } = req.body;

      const restaurant = await Restaurant.findOne({
        where: { id: req.restaurantId, tenantId: req.tenantId }
      });

      if (!restaurant) {
        throw new NotFoundError('Restaurant');
      }

      await restaurant.update({
        name,
        slug,
        description,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
        phone,
        email,
        website,
        timezone,
        currency,
        isActive
      });

      // Reload to get updated data
      await restaurant.reload();

      res.json({
        message: 'Restaurant updated successfully',
        restaurant
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user's restaurant settings (from JWT token)
   * PUT /api/restaurants/me/settings
   */
  async updateCurrentSettings(req, res, next) {
    try {
      if (!req.restaurantId) {
        throw new NotFoundError('Restaurant');
      }

      const { settings } = req.body;

      const restaurant = await Restaurant.findOne({
        where: { id: req.restaurantId, tenantId: req.tenantId }
      });

      if (!restaurant) {
        throw new NotFoundError('Restaurant');
      }

      // Merge with existing settings
      const currentSettings = restaurant.settings || {};
      const updatedSettings = {
        ...currentSettings,
        ...settings
      };

      await restaurant.update({ settings: updatedSettings });

      res.json({
        message: 'Settings updated successfully',
        settings: updatedSettings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's restaurant settings (from JWT token)
   * GET /api/restaurants/me/settings
   */
  async getCurrentSettings(req, res, next) {
    try {
      if (!req.restaurantId) {
        throw new NotFoundError('Restaurant');
      }

      const restaurant = await Restaurant.findOne({
        where: { id: req.restaurantId, tenantId: req.tenantId },
        attributes: ['id', 'settings']
      });

      if (!restaurant) {
        throw new NotFoundError('Restaurant');
      }

      res.json({
        settings: restaurant.settings || {}
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload current user's restaurant logo (from JWT token)
   * PUT /api/restaurants/me/logo
   */
  async uploadCurrentLogo(req, res, next) {
    try {
      if (!req.restaurantId) {
        throw new NotFoundError('Restaurant');
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const restaurant = await Restaurant.findOne({
        where: { id: req.restaurantId, tenantId: req.tenantId }
      });

      if (!restaurant) {
        throw new NotFoundError('Restaurant');
      }

      // In production, upload to S3/cloud storage
      // For now, store the file path or URL
      const logoUrl = `/api/uploads/logos/${req.file.filename}`;

      await restaurant.update({ logoUrl });

      // Reload to get updated data
      await restaurant.reload();

      res.json({
        message: 'Logo uploaded successfully',
        restaurant
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List restaurants (for tenant)
   * GET /api/restaurants
   */
  async list(req, res, next) {
    try {
      const restaurants = await Restaurant.findAll({
        where: { tenantId: req.tenantId },
        include: [
          { model: require('../models').Tenant, as: 'tenant', attributes: ['id', 'name'] }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({ restaurants });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RestaurantController();

