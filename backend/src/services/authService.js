const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Tenant, Restaurant } = require('../models');
const { AuthenticationError, ValidationError } = require('../utils/errors');

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
  generateToken(user, restaurantId = null) {
    const payload = {
      id: user.id,
      tenantId: user.tenantId,
      restaurantId: restaurantId || user.restaurantId,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
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
  async login(email, password) {
    const user = await User.findOne({
      where: { email, isActive: true },
      include: [
        { model: Tenant, as: 'tenant', attributes: ['id', 'name', 'slug', 'subscriptionStatus'] },
        { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'slug'] }
      ]
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check password
    const isValidPassword = await this.comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Generate token
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

  /**
   * Login with PIN (waiter app)
   */
  async loginWithPin(identifier, pin) {
    // Identifier can be email or phone
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
      throw new AuthenticationError('Invalid PIN');
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Generate token
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
        restaurant: user.restaurant
      },
      token
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const user = await User.findByPk(userId, {
      include: [
        { model: Tenant, as: 'tenant', attributes: ['id', 'name', 'slug'] },
        { model: Restaurant, as: 'restaurant', attributes: ['id', 'name', 'slug'] }
      ]
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

module.exports = new AuthService();

