const { User } = require('../models');
const authService = require('../services/authService');
const { NotFoundError, AuthorizationError, ValidationError } = require('../utils/errors');

class UserController {
  /**
   * List users
   * GET /api/users
   */
  async list(req, res, next) {
    try {
      const { role, isActive } = req.query;
      const where = {
        tenantId: req.tenantId,
        restaurantId: req.restaurantId // Only from JWT token, never from client
      };
      if (role) {
        where.role = role;
      }
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const users = await User.findAll({
        where,
        attributes: { exclude: ['passwordHash'] },
        include: [
          { model: require('../models').Restaurant, as: 'restaurant', attributes: ['id', 'name'] }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({ users });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await User.findOne({
        where: { id, tenantId: req.tenantId },
        attributes: { exclude: ['passwordHash'] },
        include: [
          { model: require('../models').Restaurant, as: 'restaurant', attributes: ['id', 'name'] }
        ]
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create user
   * POST /api/users
   */
  async create(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone, role, pinCode, assignedSections } = req.body;

      // Hash password
      const passwordHash = await authService.hashPassword(password);

      const user = await User.create({
        tenantId: req.tenantId,
        restaurantId: req.restaurantId, // Only from JWT token, never from client
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role: role || 'waiter',
        pinCode,
        assignedSections: assignedSections || []
      });

      const userData = user.toJSON();
      delete userData.passwordHash;

      res.status(201).json({
        message: 'User created successfully',
        user: userData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   * PUT /api/users/:id
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { firstName, lastName, phone, role, pinCode, assignedSections, isActive } = req.body;
      // restaurantId removed - users belong to restaurant from JWT token only

      const user = await User.findOne({
        where: { id, tenantId: req.tenantId }
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      // Don't allow changing own role or status
      if (req.user.id === id && (role !== undefined || isActive !== undefined)) {
        throw new ValidationError('Cannot modify your own role or status');
      }

      await user.update({
        firstName,
        lastName,
        phone,
        role,
        // restaurantId removed - users belong to restaurant from JWT token only
        pinCode,
        assignedSections,
        isActive
      });

      const userData = user.toJSON();
      delete userData.passwordHash;

      res.json({
        message: 'User updated successfully',
        user: userData
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete/Deactivate user
   * DELETE /api/users/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Don't allow deleting yourself
      if (req.user.id === id) {
        throw new ValidationError('Cannot delete your own account');
      }

      const user = await User.findOne({
        where: { id, tenantId: req.tenantId }
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      // Soft delete - set isActive to false
      await user.update({ isActive: false });

      res.json({
        message: 'User deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   * PUT /api/users/:id/password
   */
  async changePassword(req, res, next) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(id);

      if (!user || user.tenantId !== req.tenantId) {
        throw new NotFoundError('User');
      }

      // If changing own password, require current password
      if (req.user.id === id) {
        if (!currentPassword) {
          throw new ValidationError('Current password is required');
        }
        const isValid = await authService.comparePassword(currentPassword, user.passwordHash);
        if (!isValid) {
          throw new ValidationError('Current password is incorrect');
        }
      } else {
        // Admin changing someone else's password - no current password needed
        // But only allow admins/managers
        if (!['tenant_admin', 'admin', 'manager'].includes(req.user.role)) {
          throw new AuthorizationError('Only admins can change other users\' passwords');
        }
      }

      const passwordHash = await authService.hashPassword(newPassword);
      await user.update({ passwordHash });

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();

