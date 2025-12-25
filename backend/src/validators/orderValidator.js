const Joi = require('joi');

const modifierSchema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().required().min(0)
});

const orderItemSchema = Joi.object({
  menuItemId: Joi.string().uuid().required(),
  variantName: Joi.string().optional(),
  quantity: Joi.number().integer().required().min(1),
  modifiers: Joi.array().items(modifierSchema).optional(),
  notes: Joi.string().optional().max(500),
  kdsStation: Joi.string().optional().max(100),
  course: Joi.number().integer().optional().min(1).max(5),
  fireAt: Joi.date().optional()
});

const createOrderSchema = Joi.object({
  orderType: Joi.string().valid('dine_in', 'takeout', 'delivery').optional().default('dine_in'),
  tableId: Joi.string().uuid().optional(),
  waiterId: Joi.string().uuid().optional(),
  customerName: Joi.string().optional().max(255),
  customerPhone: Joi.string().optional().max(50),
  customerEmail: Joi.string().optional().email().max(255),
  guestCount: Joi.number().integer().optional().min(1).default(1),
  source: Joi.string().valid('pos', 'waiter_app', 'self_order', 'online').optional().default('pos'),
  notes: Joi.string().optional().max(1000),
  kitchenNotes: Joi.string().optional().max(1000),
  items: Joi.array().items(orderItemSchema).required().min(1)
});

const updateOrderSchema = Joi.object({
  tableId: Joi.string().uuid().optional(),
  waiterId: Joi.string().uuid().optional(),
  customerName: Joi.string().optional().max(255),
  customerPhone: Joi.string().optional().max(50),
  customerEmail: Joi.string().optional().email().max(255),
  guestCount: Joi.number().integer().optional().min(1),
  notes: Joi.string().optional().max(1000),
  kitchenNotes: Joi.string().optional().max(1000),
  discountAmount: Joi.number().optional().min(0),
  discountReason: Joi.string().optional().max(255)
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled')
    .required()
});

const splitOrderSchema = Joi.object({
  itemIds: Joi.array().items(Joi.string().uuid()).required().min(1)
});

const transferOrderSchema = Joi.object({
  tableId: Joi.string().uuid().required()
});

const mergeOrdersSchema = Joi.object({
  orderIds: Joi.array().items(Joi.string().uuid()).required().min(1)
});

const addOrderItemSchema = orderItemSchema;

const updateOrderItemSchema = Joi.object({
  quantity: Joi.number().integer().optional().min(1),
  modifiers: Joi.array().items(modifierSchema).optional(),
  notes: Joi.string().optional().max(500),
  course: Joi.number().integer().optional().min(1).max(5),
  fireAt: Joi.date().optional()
});

const updateOrderItemStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'preparing', 'ready', 'served', 'cancelled')
    .required()
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
  validateCreate: validate(createOrderSchema),
  validateUpdate: validate(updateOrderSchema),
  validateUpdateStatus: validate(updateOrderStatusSchema),
  validateSplit: validate(splitOrderSchema),
  validateTransfer: validate(transferOrderSchema),
  validateMerge: validate(mergeOrdersSchema),
  validateAddItem: validate(addOrderItemSchema),
  validateUpdateItem: validate(updateOrderItemSchema),
  validateUpdateItemStatus: validate(updateOrderItemStatusSchema)
};

