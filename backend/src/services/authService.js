const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Tenant, Restaurant, RefreshToken } = require('../models');
const { AuthenticationError, AuthorizationError, ValidationError } = require('../utils/errors');

class AuthService {
  /**
   * Hash password
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password
   */
  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  generateToken(user, restaurantId = null, rememberMe = false) {
    const payload = {
      id: user.id,
      tenantId: user.tenantId,
      restaurantId: restaurantId || user.restaurantId,
      email: user.email,
      role: user.role
    };

    const expiresIn = rememberMe
      ? '7d'
      : (process.env.JWT_EXPIRES_IN || '8h');

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn
    });
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(user, ipAddress = null, userAgent = null) {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const refreshToken = await RefreshToken.create({
      userId: user.id,
      token,
      expiresAt,
      ipAddress,
      userAgent
    });

    return refreshToken;
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken, ipAddress = null, userAgent = null) {
    const storedToken = await RefreshToken.findOne({
      where: {
        token: refreshToken,
        isRevoked: false,
        expiresAt: { [require('sequelize').Op.gt]: new Date() }
      },
      include: [
        { model: User, as: 'user' }
      ]
    });

    if (!storedToken) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    const user = storedToken.user;

    const accessToken = this.generateToken(user, user.restaurantId);

    const newRefreshToken = await this.generateRefreshToken(user, ipAddress, userAgent);

    await storedToken.update({ isRevoked: true });

    return {
      accessToken,
      refreshToken: newRefreshToken.token,
      expiresIn: 28800
    };
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(token) {
    await RefreshToken.update(
      { isRevoked: true },
      { where: { token } }
    );
  }

  /**
   * Revoke all refresh tokens for user
   */
  async revokeAllUserRefreshTokens(userId) {
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId } }
    );
  }

  /**
   * Register new tenant and first user
   */
  async register(registrationData) {
    const { tenant, restaurant, user } = registrationData;

    // Validate email uniqueness within tenant
    // (This will be handled by unique constraint, but we can check first)

    // Create tenant
    const newTenant = await Tenant.create({
      name: tenant.name,
      slug: tenant.slug,
      ownerEmail: user.email,
      subscriptionTier: 'starter',
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
      maxRestaurants: 1,
      maxUsers: 3,
      maxMenuItems: 100
    });

    // Create restaurant
    const newRestaurant = await Restaurant.create({
      tenantId: newTenant.id,
      name: restaurant.name,
      slug: restaurant.slug || restaurant.name.toLowerCase().replace(/\s+/g, '-'),
      ...restaurant
    });

    // Hash password
    const passwordHash = await this.hashPassword(user.password);

    // Create user
    const newUser = await User.create({
      tenantId: newTenant.id,
      restaurantId: newRestaurant.id,
      email: user.email,
      passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: 'tenant_admin'
    });

    // Generate token
    const token = this.generateToken(newUser, newRestaurant.id);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        tenantId: newUser.tenantId,
        restaurantId: newUser.restaurantId
      },
      tenant: {
        id: newTenant.id,
        name: newTenant.name,
        slug: newTenant.slug
      },
      restaurant: {
        id: newRestaurant.id,
        name: newRestaurant.name
      },
      token
    };
  }

  /**
   * Login with email/password
   */
  async login(email, password, rememberMe = false, ipAddress = null, userAgent = null) {
    const user = await User.findOne({
      where: { email, isActive: true },
      include: [
        { model: Tenant, as: 'tenant', attributes: ['id', 'name', 'slug', 'subscriptionTier', 'subscriptionStatus'] },
        { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'slug'] }
      ]
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isValidPassword = await this.comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid credentials');
    }

    await user.update({ lastLoginAt: new Date() });

    const token = this.generateToken(user, user.restaurantId, rememberMe);

    const refreshToken = await this.generateRefreshToken(user, ipAddress, userAgent);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        restaurantId: user.restaurantId,
        tenant: user.tenant,
        restaurant: user.restaurant
      },
      token,
      refreshToken: refreshToken.token,
      expiresIn: rememberMe ? 604800 : 28800
    };
  }

  /**
   * Login with PIN (waiter app)
   */
  async loginWithPin(identifier, pin, ipAddress = null, userAgent = null) {
    const user = await User.findOne({
      where: {
        isActive: true,
        role: ['waiter', 'server'],
        [require('sequelize').Op.or]: [
          { email: identifier },
          { phone: identifier }
        ]
      },
      include: [
        { model: Tenant, as: 'tenant', attributes: ['id', 'name', 'slug'] },
        { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'slug'] }
      ]
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (!user.pinCode || user.pinCode !== pin) {
      throw new AuthenticationError('Invalid credentials');
    }

    await user.update({ lastLoginAt: new Date() });

    const token = this.generateToken(user, user.restaurantId);
    const refreshToken = await this.generateRefreshToken(user, ipAddress, userAgent);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        restaurantId: user.restaurantId,
        restaurant: user.restaurant
      },
      token,
      refreshToken: refreshToken.token,
      expiresIn: 28800
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const user = await User.findByPk(userId, {
      include: [
        { model: Tenant, as: 'tenant', attributes: ['id', 'name', 'slug', 'subscriptionTier'] },
        { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'slug'] }
      ]
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
  /**
   * Impersonate user
   */
  async impersonate(userId) {
    const user = await User.findByPk(userId, {
      include: [
        { model: Tenant, as: 'tenant', attributes: ['id', 'name', 'slug', 'subscriptionTier', 'subscriptionStatus'] },
        { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'slug'] }
      ]
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    const saasAdminTenantId = process.env.SAAS_ADMIN_TENANT_ID || '00000000-0000-0000-0000-000000000000';

    if (user.tenantId !== saasAdminTenantId && user.role !== 'super_admin') {
      throw new AuthorizationError('Cannot impersonate users from other tenants');
    }

    const token = this.generateToken(user, user.restaurantId);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        restaurantId: user.restaurantId,
        tenant: user.tenant,
        restaurant: user.restaurant
      },
      token
    };
  }
}

module.exports = new AuthService();

