const authService = require('../services/authService');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');

class AuthController {
  /**
   * Login with email/password
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password, rememberMe = false } = req.body;
      const result = await authService.login(email, password, rememberMe);
      res.json({
        message: 'Login successful',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login with PIN (waiter app)
   * POST /api/auth/login/pin
   */
  async loginWithPin(req, res, next) {
    try {
      const { identifier, pin } = req.body;
      const result = await authService.loginWithPin(identifier, pin);
      res.json({
        message: 'Login successful',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  async getMe(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.id);
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
          restaurantId: user.restaurantId,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          tenant: user.tenant,
          restaurant: user.restaurant
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh token
   * POST /api/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      const ipAddress = req.ip || req.connection?.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await authService.refreshAccessToken(refreshToken, ipAddress, userAgent);

      res.json({
        message: 'Token refreshed successfully',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await authService.revokeRefreshToken(refreshToken);
      }

      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Impersonate user (Super Admin only)
   * POST /api/auth/impersonate
   */
  async impersonate(req, res, next) {
    try {
      const { userId } = req.body;

      // Ensure the requester is a super_admin
      // (Though the route middleware should handle this, double check is good practice)
      if (req.user.role !== 'super_admin') {
        throw new AuthorizationError('Only super admins can impersonate users');
      }

      const result = await authService.impersonate(userId);
      res.json({
        message: 'Impersonation successful',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

