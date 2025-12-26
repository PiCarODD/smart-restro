const { Tax } = require('../models');
const { NotFoundError } = require('../utils/errors');

class TaxController {
  /**
   * List taxes for restaurant
   * GET /api/taxes (simple list, no filters)
   * POST /api/taxes/list (with filters in body)
   */
  async list(req, res, next) {
    try {
      const where = {
        restaurantId: req.restaurantId // Only from JWT token, never from client
      };

      const taxes = await Tax.findAll({
        where,
        order: [['created_at', 'DESC']]
      });

      res.json({ taxes });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List taxes with filters (POST to prevent CSRF)
   * POST /api/taxes/list
   */
  async listFiltered(req, res, next) {
    try {
      const { activeOnly } = req.body;
      const where = {
        restaurantId: req.restaurantId // Only from JWT token, never from client
      };

      // Filter by isActive if activeOnly is provided in request body
      if (activeOnly === true || activeOnly === 'true') {
        where.isActive = true;
      }

      const taxes = await Tax.findAll({
        where,
        order: [['created_at', 'DESC']]
      });

      res.json({ taxes });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tax by ID
   * GET /api/taxes/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const tax = await Tax.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!tax) {
        throw new NotFoundError('Tax');
      }

      res.json({ tax });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create tax
   * POST /api/taxes
   */
  async create(req, res, next) {
    try {
      const { name, rate, type, appliesTo, isActive } = req.body;

      const tax = await Tax.create({
        restaurantId: req.restaurantId,
        name,
        rate,
        type: type || 'percentage',
        appliesTo: appliesTo || 'all',
        isActive: isActive !== undefined ? isActive : true
      });

      res.status(201).json({
        message: 'Tax created successfully',
        tax
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update tax
   * PUT /api/taxes/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, rate, type, appliesTo, isActive } = req.body;

      const tax = await Tax.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!tax) {
        throw new NotFoundError('Tax');
      }

      await tax.update({
        name,
        rate,
        type,
        appliesTo,
        isActive
      });

      res.json({
        message: 'Tax updated successfully',
        tax
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete tax
   * DELETE /api/taxes/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const tax = await Tax.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!tax) {
        throw new NotFoundError('Tax');
      }

      await tax.destroy();

      res.json({
        message: 'Tax deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaxController();

