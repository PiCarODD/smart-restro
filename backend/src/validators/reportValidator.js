const Joi = require('joi');

// Optional date validation - dates are validated in controller
const dateRangeSchema = Joi.object({
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  date: Joi.string().isoDate().optional()
});

const validateDateRange = (req, res, next) => {
  const { error } = dateRangeSchema.validate(req.query);
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
  validateDateRange
};

