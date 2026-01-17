const Joi = require('joi');

// Tenant creation validation
const createTenantSchema = Joi.object({
    name: Joi.string().required().min(1).max(255).trim(),
    slug: Joi.string().required().min(1).max(100).pattern(/^[a-z0-9-]+$/).messages({
        'string.pattern.base': 'Slug must contain only lowercase letters, numbers, and hyphens'
    }),
    ownerEmail: Joi.string().required().email().max(255),
    ownerFirstName: Joi.string().required().min(1).max(100).trim(),
    ownerLastName: Joi.string().required().min(1).max(100).trim(),
    password: Joi.string().required().min(8).max(100),
    subscriptionTier: Joi.string().valid('starter', 'professional', 'enterprise').default('starter'),
    phone: Joi.string().optional().max(50).allow('', null),
    billingEmail: Joi.string().optional().email().max(255).allow('', null)
});

// Bulk tenant operations validation
const bulkTenantOperationSchema = Joi.object({
    tenantIds: Joi.array().items(Joi.string().uuid()).required().min(1).max(100).messages({
        'array.min': 'At least one tenant ID is required',
        'array.max': 'Cannot process more than 100 tenants at once'
    }),
    action: Joi.string().valid('updateStatus', 'updateTier', 'delete').required(),
    value: Joi.when('action', {
        is: 'updateStatus',
        then: Joi.string().valid('active', 'trial', 'past_due', 'cancelled').required(),
        otherwise: Joi.when('action', {
            is: 'updateTier',
            then: Joi.string().valid('starter', 'professional', 'enterprise').required(),
            otherwise: Joi.boolean().optional() // for delete (softDelete)
        })
    })
});

// Update tenant validation
const updateTenantSchema = Joi.object({
    name: Joi.string().optional().min(1).max(255).trim(),
    ownerEmail: Joi.string().optional().email().max(255),
    phone: Joi.string().optional().max(50).allow('', null),
    billingEmail: Joi.string().optional().email().max(255).allow('', null)
});

// Subscription update validation
const updateSubscriptionSchema = Joi.object({
    subscriptionTier: Joi.string().valid('starter', 'professional', 'enterprise').optional(),
    status: Joi.string().valid('active', 'trial', 'past_due', 'cancelled').optional()
}).min(1).messages({
    'object.min': 'At least one field (subscriptionTier or status) must be provided'
});

// Bulk subscription operations validation
const bulkSubscriptionOperationSchema = Joi.object({
    tenantIds: Joi.array().items(Joi.string().uuid()).required().min(1).max(100).messages({
        'array.min': 'At least one tenant ID is required',
        'array.max': 'Cannot process more than 100 tenants at once'
    }),
    action: Joi.string().valid('updateTier', 'updateStatus').required(),
    value: Joi.when('action', {
        is: 'updateTier',
        then: Joi.string().valid('starter', 'professional', 'enterprise').required(),
        otherwise: Joi.string().valid('active', 'trial', 'past_due', 'cancelled').required()
    })
});

// User status update validation (SaaS admin)
const updateUserSchema = Joi.object({
    isActive: Joi.boolean().optional(),
    role: Joi.string().valid(
        'tenant_admin',
        'admin',
        'manager',
        'cashier',
        'waiter',
        'server',
        'kitchen',
        'inventory'
    ).optional(),
    tenantId: Joi.string().uuid().optional(),
    restaurantId: Joi.string().uuid().optional().allow(null)
}).min(1).messages({
    'object.min': 'At least one field must be provided'
});

// Bulk user operations validation
const bulkUserOperationSchema = Joi.object({
    userIds: Joi.array().items(Joi.string().uuid()).required().min(1).max(100).messages({
        'array.min': 'At least one user ID is required',
        'array.max': 'Cannot process more than 100 users at once'
    }),
    action: Joi.string().valid('updateStatus', 'assignRole', 'delete').required(),
    value: Joi.when('action', {
        is: 'updateStatus',
        then: Joi.boolean().required(),
        otherwise: Joi.when('action', {
            is: 'assignRole',
            then: Joi.string().valid(
                'tenant_admin',
                'admin',
                'manager',
                'cashier',
                'waiter',
                'server',
                'kitchen',
                'inventory'
            ).required(),
            otherwise: Joi.boolean().optional() // for delete (softDelete)
        })
    })
});

// Query parameters validation
const listQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().optional().allow('', null).max(255),
    status: Joi.string().valid('active', 'trial', 'past_due', 'cancelled').optional(),
    tier: Joi.string().valid('starter', 'professional', 'enterprise').optional(),
    role: Joi.string().optional(),
    tenantId: Joi.string().uuid().optional(),
    isActive: Joi.boolean().optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
});

// Export query validation
const exportQuerySchema = Joi.object({
    format: Joi.string().valid('csv', 'pdf').default('csv'),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    status: Joi.string().valid('active', 'trial', 'past_due', 'cancelled').optional(),
    tier: Joi.string().valid('starter', 'professional', 'enterprise').optional(),
    columns: Joi.array().items(Joi.string()).optional()
});

// User limit configuration validation
const updateUserLimitSchema = Joi.object({
    baseIncludedUsers: Joi.number().integer().min(0).optional(),
    extraUserMonthlyRate: Joi.number().min(0).optional()
}).min(1).messages({
    'object.min': 'At least one field (baseIncludedUsers or extraUserMonthlyRate) must be provided'
});

// Helper function to validate
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        req.body = value;
        next();
    };
};

// Helper function to validate query parameters
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Invalid query parameters',
                details: errors
            });
        }

        req.query = value;
        next();
    };
};

module.exports = {
    validateCreateTenant: validate(createTenantSchema),
    validateBulkTenantOperation: validate(bulkTenantOperationSchema),
    validateUpdateTenant: validate(updateTenantSchema),
    validateUpdateSubscription: validate(updateSubscriptionSchema),
    validateBulkSubscriptionOperation: validate(bulkSubscriptionOperationSchema),
    validateUpdateUser: validate(updateUserSchema),
    validateBulkUserOperation: validate(bulkUserOperationSchema),
    validateUpdateUserLimit: validate(updateUserLimitSchema),
    validateListQuery: validateQuery(listQuerySchema),
    validateExportQuery: validateQuery(exportQuerySchema)
};
