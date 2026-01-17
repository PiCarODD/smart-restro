const { User } = require('../models');
const authService = require('../services/authService');
const userLimitService = require('../services/userLimitService');
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
   * Users can get their own profile, admins/managers can get any profile
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

      // Check if user is trying to get their own profile or if they're an admin/manager
      if (req.user.id !== id && !['tenant_admin', 'admin', 'manager'].includes(req.user.role)) {
        throw new AuthorizationError('Not authorized to view this user');
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

      // Check user limit before creating
      const limitCheck = await userLimitService.canCreateUser(req.tenantId);
      if (!limitCheck.canCreate) {
        return res.status(403).json({
          error: 'User limit reached',
          message: limitCheck.reason || 'Cannot create more users. Contact SaaS admin to increase limit.',
          limitInfo: limitCheck.limitInfo
        });
      }

      // Hash password
      const passwordHash = await authService.hashPassword(password);

      const user = await User.create({
        tenantId: req.tenantId,
        restaurantId: req.restaurantId, // Only from JWT token, never from client
        email,
        passwordHash,
        firstName,
        lastName: lastName || firstName, // Use firstName if lastName is not provided
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
   * Users can update their own profile (firstName, lastName, phone), admins can update any user
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { fullName, firstName, lastName, phone, role, pinCode, assignedSections, isActive } = req.body;
      // restaurantId removed - users belong to restaurant from JWT token only

      const user = await User.findOne({
        where: { id, tenantId: req.tenantId }
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      // Check authorization: users can only update themselves, admins can update anyone
      const isUpdatingSelf = req.user.id === id;
      const isAdmin = ['tenant_admin', 'admin', 'manager'].includes(req.user.role);

      if (!isUpdatingSelf && !isAdmin) {
        throw new AuthorizationError('Not authorized to update this user');
      }

      // Users updating themselves cannot change role, status, pinCode, or assignedSections
      if (isUpdatingSelf && (role !== undefined || isActive !== undefined || pinCode !== undefined || assignedSections !== undefined)) {
        throw new ValidationError('Cannot modify your own role, status, PIN, or assigned sections');
      }

      // Build update data object with only provided fields
      const updateData = {};
      
      // Handle fullName - split into firstName and lastName
      if (fullName !== undefined) {
        const nameParts = fullName.trim().split(/\s+/);
        if (nameParts.length === 0) {
          throw new ValidationError('Full name cannot be empty');
        }
        updateData.firstName = nameParts[0];
        updateData.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0]; // Use first name as last name if only one word
      } else if (firstName !== undefined || lastName !== undefined) {
        // Backward compatibility: allow firstName/lastName for admin operations
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName || firstName || user.firstName;
      }
      
      if (phone !== undefined) updateData.phone = phone || null;
      if (role !== undefined && isAdmin) updateData.role = role;
      if (pinCode !== undefined && isAdmin) updateData.pinCode = pinCode || null;
      if (assignedSections !== undefined && isAdmin) updateData.assignedSections = assignedSections || [];
      if (isActive !== undefined && isAdmin) updateData.isActive = isActive;

      await user.update(updateData);

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
   * Users can change their own password (with current password), admins can change any password
   */
  async changePassword(req, res, next) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      const user = await User.findOne({
        where: { id, tenantId: req.tenantId }
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      // Check authorization: users can change their own password, admins can change any password
      const isChangingSelf = req.user.id === id;
      const isAdmin = ['tenant_admin', 'admin', 'manager'].includes(req.user.role);

      if (!isChangingSelf && !isAdmin) {
        throw new AuthorizationError('Not authorized to change this user\'s password');
      }

      // If changing own password, require current password
      if (isChangingSelf) {
        if (!currentPassword) {
          throw new ValidationError('Current password is required');
        }
        const isValid = await authService.comparePassword(currentPassword, user.passwordHash);
        if (!isValid) {
          throw new ValidationError('Current password is incorrect');
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

