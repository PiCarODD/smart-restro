const Joi = require('joi');

const createUserSchema = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required().min(8).max(100),
  firstName: Joi.string().required().min(1).max(100),
  lastName: Joi.string().optional().allow('', null).max(100),
  phone: Joi.string().optional().max(50),
  role: Joi.string().valid(
    'admin',
    'kitchen',
    'cashier',
    'manager'
  ).optional(),
  // restaurantId removed - only from JWT token for security
  pinCode: Joi.string().optional().length(6).pattern(/^\d+$/),
  assignedSections: Joi.array().items(Joi.string()).optional()
});

const updateUserSchema = Joi.object({
  fullName: Joi.string().optional().min(1).max(200), // Accept fullName instead of firstName/lastName
  firstName: Joi.string().optional().min(1).max(100), // Keep for backward compatibility with admin operations
  lastName: Joi.string().optional().min(1).max(100), // Keep for backward compatibility with admin operations
  phone: Joi.string().optional().max(50),
  role: Joi.string().valid(
    'admin',
    'kitchen',
    'cashier',
    'manager'
  ).optional(),
  // restaurantId removed - only from JWT token for security
  pinCode: Joi.string().optional().length(6).pattern(/^\d+$/),
  assignedSections: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().optional(),
  newPassword: Joi.string().required().min(8).max(100)
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  validateCreate: validate(createUserSchema),
  validateUpdate: validate(updateUserSchema),
  validateChangePassword: validate(changePasswordSchema)
};

