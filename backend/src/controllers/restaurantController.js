const { Restaurant } = require('../models');
const { NotFoundError, AuthorizationError } = require('../utils/errors');

class RestaurantController {
  /**
   * Get restaurant by ID
   * GET /api/restaurants/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const restaurant = await Restaurant.findOne({
        where: { id, tenantId: req.tenantId },
        include: [
          { model: require('../models').Tenant, as: 'tenant', attributes: ['id', 'name', 'slug'] }
        ]
      });

      if (!restaurant) {
        throw new NotFoundError('Restaurant');
      }

      res.json({ restaurant });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update restaurant
   * PUT /api/restaurants/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
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
        isActive
      } = req.body;

      const restaurant = await Restaurant.findOne({
        where: { id, tenantId: req.tenantId }
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
        isActive
      });

      res.json({
        message: 'Restaurant updated successfully',
        restaurant
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update restaurant settings
   * PUT /api/restaurants/:id/settings
   */
  async updateSettings(req, res, next) {
    try {
      const { id } = req.params;
      const { settings } = req.body;

      const restaurant = await Restaurant.findOne({
        where: { id, tenantId: req.tenantId }
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
   * Get restaurant settings
   * GET /api/restaurants/:id/settings
   */
  async getSettings(req, res, next) {
    try {
      const { id } = req.params;
      const restaurant = await Restaurant.findOne({
        where: { id, tenantId: req.tenantId },
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
   * Upload restaurant logo
   * PUT /api/restaurants/:id/logo
   */
  async uploadLogo(req, res, next) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const restaurant = await Restaurant.findOne({
        where: { id, tenantId: req.tenantId }
      });

      if (!restaurant) {
        throw new NotFoundError('Restaurant');
      }

      // In production, upload to S3/cloud storage
      // For now, store the file path or URL
      const logoUrl = `/uploads/logos/${req.file.filename}`;

      await restaurant.update({ logoUrl });

      res.json({
        message: 'Logo uploaded successfully',
        logoUrl
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

