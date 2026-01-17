const Joi = require('joi');

const createTaxSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  rate: Joi.number().required().min(0).max(100),
  type: Joi.string().valid('percentage', 'fixed').optional().default('percentage'),
  isActive: Joi.boolean().optional().default(true)
  // restaurantId removed - only from JWT token for security
  // appliesTo removed - taxes apply to all orders when enabled
});

const updateTaxSchema = Joi.object({
  name: Joi.string().optional().min(1).max(100),
  rate: Joi.number().optional().min(0).max(100),
  type: Joi.string().valid('percentage', 'fixed').optional(),
  isActive: Joi.boolean().optional()
  // appliesTo removed - taxes apply to all orders when enabled
});

const listTaxesSchema = Joi.object({
  activeOnly: Joi.boolean().optional()
  // restaurantId removed - only from JWT token for security
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
  validateUpdate: validate(updateTaxSchema),
  validateList: validate(listTaxesSchema)
};

