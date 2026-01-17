const { AuthenticationError } = require('../utils/errors');
const authService = require('../services/authService');
const { User } = require('../models');

/**
 * JWT Authentication Middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);

    // Get user from database
    const user = await User.findByPk(decoded.id, {
      include: [
        { model: require('../models').Tenant, as: 'tenant' },
        { model: require('../models').Restaurant, as: 'restaurant' }
      ]
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Debug logging (can be removed in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auth] Authenticated user:', user.id, 'Role:', user.role, 'RestaurantId:', user.restaurantId);
    }

    // Attach user and context to request
    req.user = user;
    req.tenantId = user.tenantId || decoded.tenantId;
    // Prioritize user.restaurantId from DB in case it was just assigned (onboarding)
    req.restaurantId = user.restaurantId || decoded.restaurantId;

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Role-based Access Control Middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    
    // Debug logging (can be removed in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auth] User role:', userRole, 'Allowed roles:', allowedRoles);
      console.log('[Auth] User restaurantId:', req.restaurantId, 'User object restaurantId:', req.user.restaurantId);
    }

    // Check if user role is in allowed roles
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `User role '${userRole || 'null'}' is not in allowed roles: ${allowedRoles.join(', ')}`,
        userRole: userRole,
        allowedRoles: allowedRoles
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = authService.verifyToken(token);
      const user = await User.findByPk(decoded.id);

      if (user && user.isActive) {
        req.user = user;
        req.tenantId = decoded.tenantId;
        req.restaurantId = decoded.restaurantId;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};

