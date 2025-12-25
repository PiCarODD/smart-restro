const Joi = require('joi');

const registerSchema = Joi.object({
  tenant: Joi.object({
    name: Joi.string().required().min(2).max(255),
    slug: Joi.string().optional().min(2).max(100).pattern(/^[a-z0-9-]+$/),
    phone: Joi.string().optional().max(50)
  }).required(),
  restaurant: Joi.object({
    name: Joi.string().required().min(2).max(255),
    slug: Joi.string().optional().min(2).max(100),
    addressLine1: Joi.string().optional().max(255),
    city: Joi.string().optional().max(100),
    state: Joi.string().optional().max(100),
    postalCode: Joi.string().optional().max(20),
    country: Joi.string().optional().max(100),
    phone: Joi.string().optional().max(50),
    email: Joi.string().optional().email()
  }).required(),
  user: Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8).max(100),
    firstName: Joi.string().required().min(1).max(100),
    lastName: Joi.string().required().min(1).max(100),
    phone: Joi.string().optional().max(50)
  }).required()
});

const loginSchema = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required()
});

const pinLoginSchema = Joi.object({
  identifier: Joi.string().required(), // email or phone
  pin: Joi.string().required().length(6).pattern(/^\d+$/)
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().required().email()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().required().min(8).max(100)
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
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validatePinLogin: validate(pinLoginSchema),
  validateForgotPassword: validate(forgotPasswordSchema),
  validateResetPassword: validate(resetPasswordSchema)
};

