# Restaurant ID Security Guidelines

## Critical Security Rule

**`restaurantId` must NEVER be accepted from client requests.**

## Why This Matters

Accepting `restaurantId` from query parameters, request bodies, or URL parameters creates a critical security vulnerability:

1. **IDOR (Insecure Direct Object Reference)**: Attackers can access data from other restaurants by changing the `restaurantId` in requests.
2. **BAC (Broken Access Control)**: Users can modify or delete data belonging to other restaurants.

## Implementation Rules

### ✅ CORRECT Implementation

```javascript
// Controller - Only use req.restaurantId from JWT
const where = {
  restaurantId: req.restaurantId // ✅ Always from JWT token
};

// Validator - Never accept restaurantId
const schema = Joi.object({
  name: Joi.string().required(),
  // ❌ NO restaurantId field here
});

// Frontend API - Never send restaurantId
const response = await api.get('/tables'); // ✅ No restaurantId in params
```

### ❌ WRONG Implementation

```javascript
// ❌ WRONG - Accepting restaurantId from query
const { restaurantId } = req.query;
const where = {
  restaurantId: restaurantId || req.restaurantId // ❌ Security vulnerability!
};

// ❌ WRONG - Allowing restaurantId in validator
const schema = Joi.object({
  restaurantId: Joi.string().uuid().optional() // ❌ Should never accept this
});

// ❌ WRONG - Sending restaurantId from frontend
const response = await api.get('/tables', { 
  params: { restaurantId: user.restaurantId } // ❌ Should not send this
});
```

## How It Works

1. User logs in → JWT token contains `restaurantId`
2. Auth middleware extracts `restaurantId` from JWT → Sets `req.restaurantId`
3. Controller uses `req.restaurantId` → Always the correct restaurant from token
4. Validator strips unknown fields → If `restaurantId` is sent, it's ignored

## Files That Must Follow This Rule

### Backend Controllers
- ✅ Always use `req.restaurantId` (from JWT)
- ❌ Never accept `restaurantId` from `req.query` or `req.body`

### Backend Validators
- ✅ Never include `restaurantId` field in schemas
- ✅ Validators use `stripUnknown: true` to ignore unexpected fields

### Frontend API Services
- ✅ Never include `restaurantId` in request params
- ✅ Never include `restaurantId` in request body

### Frontend Stores
- ✅ Never extract `restaurantId` from user object
- ✅ Never pass `restaurantId` to API calls

## Special Cases

### User Management
For user creation/update, `restaurantId` is set from JWT token. Users cannot create users for other restaurants.

### Multi-Restaurant Tenants
Even for tenant_admin users managing multiple restaurants, they must authenticate with a specific restaurant's credentials to access that restaurant's data.

## Testing

When testing, verify:
1. Cannot access other restaurant's data by changing `restaurantId` in URL
2. Cannot create resources for other restaurants
3. API calls work without sending `restaurantId`
4. JWT token contains correct `restaurantId`

