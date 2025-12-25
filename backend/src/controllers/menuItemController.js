const { MenuItem, MenuCategory } = require('../models');
const { NotFoundError } = require('../utils/errors');
const { Op } = require('sequelize');

class MenuItemController {
  /**
   * List menu items with filters
   * GET /api/menu/items
   */
  async list(req, res, next) {
    try {
      const { categoryId, isActive, isAvailable, search, page = 1, limit = 20 } = req.query;
      
      const where = {
        restaurantId: req.restaurantId // Only from JWT token, never from client
      };

      if (categoryId) {
        where.categoryId = categoryId;
      }
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }
      if (isAvailable !== undefined) {
        where.isAvailable = isAvailable === 'true';
      }
      if (search) {
        where.name = { [Op.iLike]: `%${search}%` };
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: items } = await MenuItem.findAndCountAll({
        where,
        include: [
          { model: MenuCategory, as: 'category', attributes: ['id', 'name', 'color'] },
          { model: require('../models').Restaurant, as: 'restaurant', attributes: ['id', 'name'] }
        ],
        order: [['display_order', 'ASC'], ['created_at', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get menu item by ID
   * GET /api/menu/items/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await MenuItem.findOne({
        where: { id, restaurantId: req.restaurantId },
        include: [
          { model: MenuCategory, as: 'category' },
          { model: require('../models').Restaurant, as: 'restaurant', attributes: ['id', 'name'] }
        ]
      });

      if (!item) {
        throw new NotFoundError('Menu item');
      }

      res.json({ item });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create menu item
   * POST /api/menu/items
   */
  async create(req, res, next) {
    try {
      const {
        categoryId,
        name,
        description,
        shortDescription,
        basePrice,
        costPrice,
        variants,
        modifiers,
        imageUrl,
        images,
        calories,
        allergens,
        dietaryTags,
        displayOrder,
        isFeatured,
        isNew,
        isActive,
        isAvailable,
        availableStartTime,
        availableEndTime,
        availableDays,
        prepTimeMinutes,
        kdsStation,
        trackInventory
      } = req.body;

      const item = await MenuItem.create({
        restaurantId: req.restaurantId,
        categoryId,
        name,
        description,
        shortDescription,
        basePrice,
        costPrice,
        variants: variants || [],
        modifiers: modifiers || [],
        imageUrl: imageUrl || null, // Convert empty string to null
        images: images || [],
        calories,
        allergens: allergens || [],
        dietaryTags: dietaryTags || [],
        displayOrder: displayOrder || 0,
        isFeatured: isFeatured || false,
        isNew: isNew || false,
        isActive: isActive !== undefined ? isActive : true,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        availableStartTime,
        availableEndTime,
        availableDays,
        prepTimeMinutes,
        kdsStation,
        trackInventory: trackInventory !== undefined ? trackInventory : true
      });

      res.status(201).json({
        message: 'Menu item created successfully',
        item
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update menu item
   * PUT /api/menu/items/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { imageUrl, ...updateData } = req.body;

      const item = await MenuItem.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!item) {
        throw new NotFoundError('Menu item');
      }

      // Handle imageUrl separately to convert empty strings to null
      const finalUpdateData = {
        ...updateData,
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null })
      };

      await item.update(finalUpdateData);

      res.json({
        message: 'Menu item updated successfully',
        item
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete menu item
   * DELETE /api/menu/items/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const item = await MenuItem.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!item) {
        throw new NotFoundError('Menu item');
      }

      await item.destroy();

      res.json({
        message: 'Menu item deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle availability
   * PUT /api/menu/items/:id/availability
   */
  async toggleAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const { isAvailable } = req.body;

      const item = await MenuItem.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!item) {
        throw new NotFoundError('Menu item');
      }

      await item.update({ isAvailable: isAvailable !== undefined ? isAvailable : !item.isAvailable });

      res.json({
        message: `Menu item ${item.isAvailable ? 'marked as available' : 'marked as unavailable (86\'d)'}`,
        item
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload menu item image
   * PUT /api/menu/items/:id/image
   */
  async uploadImage(req, res, next) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const item = await MenuItem.findOne({
        where: { id, restaurantId: req.restaurantId }
      });

      if (!item) {
        throw new NotFoundError('Menu item');
      }

      // In production, upload to S3/cloud storage
      const imageUrl = `/uploads/menu-items/${req.file.filename}`;

      // Add to images array if it exists, otherwise set as main image
      const images = item.images || [];
      if (!item.imageUrl) {
        await item.update({ imageUrl });
      }
      images.push(imageUrl);
      await item.update({ images });

      res.json({
        message: 'Image uploaded successfully',
        imageUrl,
        images
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recipe for menu item (redirects to recipe controller)
   * GET /api/menu/items/:id/recipe
   */
  async getRecipe(req, res, next) {
    try {
      // Redirect to recipe controller
      const recipeController = require('./recipeController');
      req.params.menuItemId = req.params.id;
      return recipeController.getRecipe(req, res, next);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update recipe for menu item (redirects to recipe controller)
   * PUT /api/menu/items/:id/recipe
   */
  async updateRecipe(req, res, next) {
    try {
      // Redirect to recipe controller
      const recipeController = require('./recipeController');
      req.params.menuItemId = req.params.id;
      return recipeController.updateRecipe(req, res, next);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MenuItemController();

