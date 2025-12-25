const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().optional().max(1000),
  imageUrl: Joi.string().optional().uri().max(500),
  displayOrder: Joi.number().integer().optional().default(0),
  color: Joi.string().optional().pattern(/^#[0-9A-Fa-f]{6}$/),
  icon: Joi.string().optional().max(50).allow('', null), // Allow empty string since UI doesn't require icon
  parentId: Joi.string().uuid().optional().allow(null),
  isActive: Joi.boolean().optional().default(true),
  availableStartTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  availableEndTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  availableDays: Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
  kdsStation: Joi.string().optional().max(100)
  // restaurantId removed - only from JWT token for security
});

const updateCategorySchema = Joi.object({
  name: Joi.string().optional().min(1).max(100),
  description: Joi.string().optional().max(1000),
  imageUrl: Joi.string().optional().uri().max(500),
  displayOrder: Joi.number().integer().optional(),
  color: Joi.string().optional().pattern(/^#[0-9A-Fa-f]{6}$/),
  icon: Joi.string().optional().max(50).allow('', null), // Allow empty string since UI doesn't require icon
  parentId: Joi.string().uuid().optional().allow(null),
  isActive: Joi.boolean().optional(),
  availableStartTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  availableEndTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  availableDays: Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
  kdsStation: Joi.string().optional().max(100)
});

const reorderCategoriesSchema = Joi.object({
  categoryIds: Joi.array().items(Joi.string().uuid()).required().min(1)
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
  validateCreate: validate(createCategorySchema),
  validateUpdate: validate(updateCategorySchema),
  validateReorder: validate(reorderCategoriesSchema)
};

