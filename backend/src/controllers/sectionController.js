const { Section } = require('../models');
const { NotFoundError } = require('../utils/errors');

class SectionController {
  /**
   * List sections for restaurant
   * GET /api/sections
   */
  async list(req, res, next) {
    try {
      const where = {
        restaurantId: req.restaurantId // Only from JWT token, never from client
      };

      const sections = await Section.findAll({
        where,
        include: [
          { model: require('../models').Restaurant, as: 'restaurant', attributes: ['id', 'name'] },
          { model: require('../models').Table, as: 'tables', attributes: ['id', 'tableNumber', 'status'] }
        ],
        order: [['display_order', 'ASC'], ['created_at', 'ASC']]
      });

      res.json({ sections });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get section by ID
   * GET /api/sections/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const section = await Section.findOne({
        where: { id, restaurantId: req.restaurantId },
        include: [
          { model: require('../models').Table, as: 'tables' }
        ]
      });

      if (!section) {
        throw new NotFoundError('Section');
      }

      res.json({ section });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create section
   * POST /api/sections
   */
  async create(req, res, next) {
    try {
      const { name, description, color, icon, displayOrder, isActive } = req.body;

      const section = await Section.create({
        restaurantId: req.restaurantId,
        name,
        description,
        color,
        icon,
        displayOrder: displayOrder !== undefined ? displayOrder : 0,
        isActive: isActive !== undefined ? isActive : true
      });

      res.status(201).json({
        message: 'Section created successfully',
        section
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update section
   * PUT /api/sections/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, color, icon, displayOrder, isActive } = req.body;

      const section = await Section.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!section) {
        throw new NotFoundError('Section');
      }

      await section.update({
        name,
        description,
        color,
        icon,
        displayOrder,
        isActive
      });

      res.json({
        message: 'Section updated successfully',
        section
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete section
   * DELETE /api/sections/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const section = await Section.findOne({
        where: { id, restaurantId: req.restaurantId },
        include: [{ model: require('../models').Table, as: 'tables' }]
      });

      if (!section) {
        throw new NotFoundError('Section');
      }

      // Check if section has tables
      if (section.tables && section.tables.length > 0) {
        return res.status(400).json({
          error: 'Cannot delete section with tables',
          message: 'Please move or delete all tables in this section first'
        });
      }

      await section.destroy();

      res.json({
        message: 'Section deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder sections
   * PUT /api/sections/reorder
   */
  async reorder(req, res, next) {
    try {
      const { sectionIds } = req.body; // Array of section IDs in new order

      if (!Array.isArray(sectionIds)) {
        return res.status(400).json({ error: 'sectionIds must be an array' });
      }

      // Update display order for each section
      const updates = sectionIds.map((sectionId, index) => {
        return Section.update(
          { displayOrder: index },
          { where: { id: sectionId, restaurantId: req.restaurantId } }
        );
      });

      await Promise.all(updates);

      res.json({
        message: 'Sections reordered successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SectionController();

