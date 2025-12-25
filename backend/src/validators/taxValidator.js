const Joi = require('joi');

const createTaxSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  rate: Joi.number().required().min(0).max(100),
  type: Joi.string().valid('percentage', 'fixed').optional().default('percentage'),
  appliesTo: Joi.string().valid('all', 'food', 'beverage', 'alcohol').optional().default('all'),
  isActive: Joi.boolean().optional().default(true)
  // restaurantId removed - only from JWT token for security
});

const updateTaxSchema = Joi.object({
  name: Joi.string().optional().min(1).max(100),
  rate: Joi.number().optional().min(0).max(100),
  type: Joi.string().valid('percentage', 'fixed').optional(),
  appliesTo: Joi.string().valid('all', 'food', 'beverage', 'alcohol').optional(),
  isActive: Joi.boolean().optional()
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
  validateCreate: validate(createTaxSchema),
  validateUpdate: validate(updateTaxSchema)
};

