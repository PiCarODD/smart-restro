const { MenuCategory } = require('../models');
const { NotFoundError } = require('../utils/errors');

class MenuCategoryController {
  /**
   * List categories for restaurant
   * GET /api/menu/categories
   */
  async list(req, res, next) {
    try {
      const { parentId, isActive } = req.query;
      const where = {
        restaurantId: req.restaurantId // Only from JWT token, never from client
      };

      if (parentId !== undefined) {
        where.parentId = parentId === 'null' ? null : parentId;
      }
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const categories = await MenuCategory.findAll({
        where,
        include: [
          { model: require('../models').Restaurant, as: 'restaurant', attributes: ['id', 'name'] },
          { model: MenuCategory, as: 'parent', attributes: ['id', 'name'] },
          { model: MenuCategory, as: 'subcategories', attributes: ['id', 'name', 'displayOrder'] }
        ],
        order: [['display_order', 'ASC'], ['created_at', 'ASC']]
      });

      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category by ID
   * GET /api/menu/categories/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await MenuCategory.findOne({
        where: { id, restaurantId: req.restaurantId },
        include: [
          { model: MenuCategory, as: 'parent' },
          { model: MenuCategory, as: 'subcategories' },
          { model: require('../models').MenuItem, as: 'menuItems' }
        ]
      });

      if (!category) {
        throw new NotFoundError('Menu category');
      }

      res.json({ category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create category
   * POST /api/menu/categories
   */
  async create(req, res, next) {
    try {
      const {
        name,
        description,
        imageUrl,
        displayOrder,
        color,
        icon,
        parentId,
        isActive,
        availableStartTime,
        availableEndTime,
        availableDays,
        kdsStation
      } = req.body;

      const category = await MenuCategory.create({
        restaurantId: req.restaurantId,
        name,
        description,
        imageUrl,
        displayOrder: displayOrder !== undefined ? displayOrder : 0,
        color,
        icon: icon || null, // Convert empty string to null
        parentId,
        isActive: isActive !== undefined ? isActive : true,
        availableStartTime,
        availableEndTime,
        availableDays,
        kdsStation
      });

      res.status(201).json({
        message: 'Menu category created successfully',
        category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update category
   * PUT /api/menu/categories/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        imageUrl,
        displayOrder,
        color,
        icon,
        parentId,
        isActive,
        availableStartTime,
        availableEndTime,
        availableDays,
        kdsStation
      } = req.body;

      const category = await MenuCategory.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!category) {
        throw new NotFoundError('Menu category');
      }

      await category.update({
        name,
        description,
        imageUrl,
        displayOrder,
        color,
        icon: icon !== undefined ? (icon || null) : category.icon, // Convert empty string to null
        parentId,
        isActive,
        availableStartTime,
        availableEndTime,
        availableDays,
        kdsStation
      });

      res.json({
        message: 'Menu category updated successfully',
        category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete category
   * DELETE /api/menu/categories/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const category = await MenuCategory.findOne({
        where: { id, restaurantId: req.restaurantId },
        include: [{ model: require('../models').MenuItem, as: 'menuItems' }]
      });

      if (!category) {
        throw new NotFoundError('Menu category');
      }

      // Check if category has items
      if (category.menuItems && category.menuItems.length > 0) {
        return res.status(400).json({
          error: 'Cannot delete category with menu items',
          message: 'Please move or delete all items in this category first'
        });
      }

      await category.destroy();

      res.json({
        message: 'Menu category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reorder categories
   * PUT /api/menu/categories/reorder
   */
  async reorder(req, res, next) {
    try {
      const { categoryIds } = req.body; // Array of category IDs in new order

      if (!Array.isArray(categoryIds)) {
        return res.status(400).json({ error: 'categoryIds must be an array' });
      }

      // Update display order for each category
      const updates = categoryIds.map((categoryId, index) => {
        return MenuCategory.update(
          { displayOrder: index },
          { where: { id: categoryId, restaurantId: req.restaurantId } }
        );
      });

      await Promise.all(updates);

      res.json({
        message: 'Categories reordered successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MenuCategoryController();

