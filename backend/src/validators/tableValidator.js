const Joi = require('joi');

const createTableSchema = Joi.object({
  tableNumber: Joi.string().required().min(1).max(20),
  name: Joi.string().optional().max(100).allow('', null),
  sectionId: Joi.string().uuid().optional(),
  section: Joi.string().optional().max(100),
  floor: Joi.number().integer().optional().default(1).min(1),
  capacity: Joi.number().integer().required().min(1).max(50),
  shape: Joi.string().valid('square', 'round', 'rectangle').optional().default('square'),
  positionX: Joi.number().integer().optional().default(0),
  positionY: Joi.number().integer().optional().default(0),
  width: Joi.number().integer().optional().default(100).min(50),
  height: Joi.number().integer().optional().default(100).min(50),
  rotation: Joi.number().integer().optional().default(0).min(0).max(360)
  // restaurantId removed - only from JWT token for security
});

const updateTableSchema = Joi.object({
  tableNumber: Joi.string().optional().min(1).max(20),
  name: Joi.string().optional().max(100).allow('', null),
  sectionId: Joi.string().uuid().optional().allow(null),
  section: Joi.string().optional().max(100),
  floor: Joi.number().integer().optional().min(1),
  capacity: Joi.number().integer().optional().min(1).max(50),
  shape: Joi.string().valid('square', 'round', 'rectangle').optional(),
  positionX: Joi.number().integer().optional(),
  positionY: Joi.number().integer().optional(),
  width: Joi.number().integer().optional().min(50),
  height: Joi.number().integer().optional().min(50),
  rotation: Joi.number().integer().optional().min(0).max(360)
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('available', 'occupied', 'reserved', 'cleaning', 'blocked')
    .required(),
  guestCount: Joi.number().integer().optional().min(1),
  orderId: Joi.string().uuid().optional()
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
  validateCreate: validate(createTableSchema),
  validateUpdate: validate(updateTableSchema),
  validateUpdateStatus: validate(updateStatusSchema)
};

