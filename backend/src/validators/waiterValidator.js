const Joi = require('joi');

const createOrderSchema = Joi.object({
  tableId: Joi.string().uuid().required(),
  guestCount: Joi.number().integer().min(1).optional().default(1),
  items: Joi.array().items(
    Joi.object({
      menuItemId: Joi.string().uuid().required(),
      variantName: Joi.string().optional(),
      quantity: Joi.number().integer().min(1).required(),
      modifiers: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          price: Joi.number().optional().default(0)
        })
      ).optional(),
      notes: Joi.string().optional().max(1000),
      kdsStation: Joi.string().optional(),
      course: Joi.number().integer().min(1).optional().default(1)
    })
  ).optional().default([])
});

const validateCreateOrder = (req, res, next) => {
  const { error } = createOrderSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  next();
};

module.exports = {
  validateCreateOrder
};

