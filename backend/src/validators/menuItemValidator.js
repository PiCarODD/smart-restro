const Joi = require('joi');

const variantSchema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().required().min(0)
});

const modifierSchema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().required().min(0)
});

const createMenuItemSchema = Joi.object({
  categoryId: Joi.string().uuid().required(),
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().optional().max(2000),
  shortDescription: Joi.string().optional().max(500),
  basePrice: Joi.number().required().min(0),
  costPrice: Joi.number().optional().min(0),
  variants: Joi.array().items(variantSchema).optional(),
  modifiers: Joi.array().items(modifierSchema).optional(),
  imageUrl: Joi.string().optional().allow('', null).max(500), // Allow relative paths, empty strings, or null
  images: Joi.array().items(Joi.string().uri()).optional(),
  calories: Joi.number().integer().optional().min(0),
  allergens: Joi.array().items(Joi.string()).optional(),
  dietaryTags: Joi.array().items(Joi.string()).optional(),
  displayOrder: Joi.number().integer().optional().default(0),
  isFeatured: Joi.boolean().optional().default(false),
  isNew: Joi.boolean().optional().default(false),
  isActive: Joi.boolean().optional().default(true),
  isAvailable: Joi.boolean().optional().default(true),
  availableStartTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  availableEndTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  availableDays: Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
  prepTimeMinutes: Joi.number().integer().optional().min(0),
  kdsStation: Joi.string().optional().max(100),
  trackInventory: Joi.boolean().optional().default(true)
  // restaurantId removed - only from JWT token for security
});

const updateMenuItemSchema = Joi.object({
  categoryId: Joi.string().uuid().optional(),
  name: Joi.string().optional().min(1).max(255),
  description: Joi.string().optional().max(2000),
  shortDescription: Joi.string().optional().max(500),
  basePrice: Joi.number().optional().min(0),
  costPrice: Joi.number().optional().min(0),
  variants: Joi.array().items(variantSchema).optional(),
  modifiers: Joi.array().items(modifierSchema).optional(),
  imageUrl: Joi.string().optional().allow('', null).max(500), // Allow relative paths, empty strings, or null
  images: Joi.array().items(Joi.string().uri()).optional(),
  calories: Joi.number().integer().optional().min(0),
  allergens: Joi.array().items(Joi.string()).optional(),
  dietaryTags: Joi.array().items(Joi.string()).optional(),
  displayOrder: Joi.number().integer().optional(),
  isFeatured: Joi.boolean().optional(),
  isNew: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  isAvailable: Joi.boolean().optional(),
  availableStartTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  availableEndTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  availableDays: Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
  prepTimeMinutes: Joi.number().integer().optional().min(0),
  kdsStation: Joi.string().optional().max(100),
  trackInventory: Joi.boolean().optional()
});

const toggleAvailabilitySchema = Joi.object({
  isAvailable: Joi.boolean().optional()
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
  validateCreate: validate(createMenuItemSchema),
  validateUpdate: validate(updateMenuItemSchema),
  validateToggleAvailability: validate(toggleAvailabilitySchema)
};

