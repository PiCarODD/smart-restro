const Joi = require('joi');

const createIngredientSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  sku: Joi.string().optional().max(100),
  barcode: Joi.string().optional().max(100),
  categoryId: Joi.string().uuid().optional(),
  category: Joi.string().optional().max(100),
  unit: Joi.string().required().max(50),
  unitCost: Joi.number().optional().min(0).default(0),
  currentStock: Joi.number().optional().min(0).default(0),
  minimumStock: Joi.number().optional().min(0).default(0),
  maximumStock: Joi.number().optional().min(0),
  reorderQuantity: Joi.number().optional().min(0),
  supplierName: Joi.string().optional().max(255),
  supplierSku: Joi.string().optional().max(100),
  storageLocation: Joi.string().optional().max(100),
  storageTemp: Joi.string().optional().max(50),
  shelfLifeDays: Joi.number().integer().optional().min(0),
  isActive: Joi.boolean().optional().default(true)
});

const updateIngredientSchema = Joi.object({
  name: Joi.string().optional().min(1).max(255),
  sku: Joi.string().optional().max(100),
  barcode: Joi.string().optional().max(100),
  categoryId: Joi.string().uuid().optional(),
  category: Joi.string().optional().max(100),
  unit: Joi.string().optional().max(50),
  unitCost: Joi.number().optional().min(0),
  currentStock: Joi.number().optional().min(0),
  minimumStock: Joi.number().optional().min(0),
  maximumStock: Joi.number().optional().min(0),
  reorderQuantity: Joi.number().optional().min(0),
  supplierName: Joi.string().optional().max(255),
  supplierSku: Joi.string().optional().max(100),
  storageLocation: Joi.string().optional().max(100),
  storageTemp: Joi.string().optional().max(50),
  shelfLifeDays: Joi.number().integer().optional().min(0),
  isActive: Joi.boolean().optional()
});

const adjustStockSchema = Joi.object({
  quantityChange: Joi.number().required(),
  transactionType: Joi.string()
    .valid('manual_adjustment', 'purchase', 'waste', 'transfer_in', 'transfer_out', 'correction')
    .optional()
    .default('manual_adjustment'),
  notes: Joi.string().optional().max(500)
});

const stockTakeSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      ingredientId: Joi.string().uuid().required(),
      countedStock: Joi.number().required().min(0),
      notes: Joi.string().optional().max(500)
    })
  ).required().min(1)
});

const updateRecipeSchema = Joi.object({
  ingredients: Joi.array().items(
    Joi.object({
      ingredientId: Joi.string().uuid().required(),
      quantity: Joi.number().required().min(0),
      unit: Joi.string().required().max(50),
      variantName: Joi.string().optional().max(100).allow(null),
      wasteFactor: Joi.number().optional().min(0).default(1.0),
      notes: Joi.string().optional().max(500).allow(null)
    })
  ).optional()
});

const createIngredientCategorySchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().optional().max(500),
  displayOrder: Joi.number().integer().optional().default(0)
});

const updateIngredientCategorySchema = Joi.object({
  name: Joi.string().optional().min(1).max(100),
  description: Joi.string().optional().max(500),
  displayOrder: Joi.number().integer().optional()
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
  validateCreateIngredient: validate(createIngredientSchema),
  validateUpdateIngredient: validate(updateIngredientSchema),
  validateAdjustStock: validate(adjustStockSchema),
  validateStockTake: validate(stockTakeSchema),
  validateUpdateRecipe: validate(updateRecipeSchema),
  validateCreateIngredientCategory: validate(createIngredientCategorySchema),
  validateUpdateIngredientCategory: validate(updateIngredientCategorySchema)
};

