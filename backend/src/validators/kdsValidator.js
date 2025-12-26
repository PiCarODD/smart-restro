const Joi = require('joi');

const updateItemStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'preparing', 'ready', 'served', 'cancelled').required()
});

const validateUpdateItemStatus = (req, res, next) => {
  const { error } = updateItemStatusSchema.validate(req.body);
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
  validateUpdateItemStatus
};

