const Joi = require('joi');

const createSectionSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().optional().max(500),
  color: Joi.string().optional().pattern(/^#[0-9A-Fa-f]{6}$/),
  icon: Joi.string().optional().max(50).allow(''),
  displayOrder: Joi.number().integer().optional().default(0),
  isActive: Joi.boolean().optional().default(true)
  // restaurantId removed - only from JWT token for security
});

const updateSectionSchema = Joi.object({
  name: Joi.string().optional().min(1).max(100),
  description: Joi.string().optional().max(500),
  color: Joi.string().optional().pattern(/^#[0-9A-Fa-f]{6}$/),
  icon: Joi.string().optional().max(50).allow(''),
  displayOrder: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional()
});

const reorderSectionsSchema = Joi.object({
  sectionIds: Joi.array().items(Joi.string().uuid()).required().min(1)
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
  validateCreate: validate(createSectionSchema),
  validateUpdate: validate(updateSectionSchema),
  validateReorder: validate(reorderSectionsSchema)
};

