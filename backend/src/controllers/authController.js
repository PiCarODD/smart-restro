const authService = require('../services/authService');
const { AuthenticationError } = require('../utils/errors');

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
      // For now, just return success (token refresh can be implemented later with refresh tokens)
      res.json({
        message: 'Token refresh - implement refresh token logic if needed'
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
      // For JWT, logout is handled client-side by removing token
      // If using refresh tokens, invalidate them here
      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

