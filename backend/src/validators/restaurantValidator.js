const Joi = require('joi');

const updateRestaurantSchema = Joi.object({
  name: Joi.string().optional().min(2).max(255),
  slug: Joi.string().optional().min(2).max(100).pattern(/^[a-z0-9-]+$/),
  description: Joi.string().optional().max(1000),
  addressLine1: Joi.string().optional().max(255),
  addressLine2: Joi.string().optional().max(255),
  city: Joi.string().optional().max(100),
  state: Joi.string().optional().max(100),
  postalCode: Joi.string().optional().max(20),
  country: Joi.string().optional().max(100),
  phone: Joi.string().optional().max(50),
  email: Joi.string().optional().email(),
  website: Joi.string().optional().uri().allow(''),
  timezone: Joi.string().optional(),
  currency: Joi.string().optional().length(3),
  isActive: Joi.boolean().optional()
});

const settingsSchema = Joi.object({
  features: Joi.object({
    kds: Joi.object({
      enabled: Joi.boolean(),
      stations: Joi.array().items(Joi.string()).optional(),
      slaMinutes: Joi.number().optional(),
      darkMode: Joi.boolean().optional(),
      soundAlerts: Joi.boolean().optional()
    }).optional(),
    waiterApp: Joi.object({
      enabled: Joi.boolean(),
      allowExternalAccess: Joi.boolean().optional(),
      requirePin: Joi.boolean().optional()
    }).optional(),
    inventory: Joi.object({
      enabled: Joi.boolean(),
      autoDeduction: Joi.boolean().optional(),
      deductionTrigger: Joi.string().valid('on_order_placed', 'on_order_confirmed', 'on_completed').optional(),
      lowStockAlerts: Joi.boolean().optional(),
      alertThreshold: Joi.number().optional()
    }).optional(),
    reservations: Joi.object({
      enabled: Joi.boolean(),
      maxAdvanceDays: Joi.number().optional(),
      requireDeposit: Joi.boolean().optional()
    }).optional(),
    selfOrdering: Joi.object({
      enabled: Joi.boolean(),
      requirePaymentUpfront: Joi.boolean().optional()
    }).optional(),
    loyalty: Joi.object({
      enabled: Joi.boolean(),
      pointsPerDollar: Joi.number().optional(),
      rewardThreshold: Joi.number().optional()
    }).optional()
  }).optional(),
  operations: Joi.object({
    taxRate: Joi.number().optional(),
    serviceCharge: Joi.number().optional(),
    tipSuggestions: Joi.array().items(Joi.number()).optional(),
    currency: Joi.string().optional(),
    timezone: Joi.string().optional(),
    openingHours: Joi.object().optional()
  }).optional(),
  ui: Joi.object({
    theme: Joi.string().valid('light', 'dark', 'system').optional(),
    primaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    logo: Joi.string().uri().optional(),
    receiptFooter: Joi.string().optional()
  }).optional()
}).optional();

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
  validateUpdate: validate(updateRestaurantSchema),
  validateSettings: validate(settingsSchema)
};

