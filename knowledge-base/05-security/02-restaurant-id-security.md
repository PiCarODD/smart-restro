# Restaurant ID Security

## Critical Security Rule

**`restaurantId` should NEVER be accepted from client requests (query parameters, request body, or URL parameters). It must ALWAYS be extracted from the JWT token via `req.restaurantId` set by the authentication middleware.**

## Why This Matters

Accepting `restaurantId` from the client allows:

1. **IDOR (Insecure Direct Object Reference)**: Users could access data belonging to other restaurants
2. **BAC (Broken Access Control)**: Users could modify data they shouldn't have access to
3. **Data Leakage**: Unauthorized access to sensitive restaurant data

## Implementation

### ✅ CORRECT Implementation

```javascript
// middleware/auth.js
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Extract restaurantId from token
    req.userId = decoded.userId;
    req.restaurantId = decoded.restaurantId; // ✅ From JWT
    req.role = decoded.role;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// controllers/orderController.js
const getOrders = async (req, res) => {
  const where = {
    restaurantId: req.restaurantId // ✅ Only from JWT
  };
  
  const orders = await Order.findAll({ where });
  res.json({ success: true, data: orders });
};
```

### ❌ WRONG Implementation

```javascript
// ❌ NEVER DO THIS
const getOrders = async (req, res) => {
  const { restaurantId } = req.query; // ❌ Security vulnerability!
  
  const where = {
    restaurantId: restaurantId || req.restaurantId // ❌ Still vulnerable!
  };
  
  const orders = await Order.findAll({ where });
  res.json({ success: true, data: orders });
};
```

```javascript
// ❌ NEVER DO THIS
const getOrders = async (req, res) => {
  const { restaurantId } = req.body; // ❌ Security vulnerability!
  
  const orders = await Order.findAll({ 
    where: { restaurantId } 
  });
  res.json({ success: true, data: orders });
};
```

## Validator Rules

### ✅ CORRECT Validator

```javascript
// validators/orderValidator.js
const getOrdersSchema = {
  query: Joi.object({
    status: Joi.string().optional(),
    tableId: Joi.string().uuid().optional(),
    // ❌ NO restaurantId in validator
  })
};
```

### ❌ WRONG Validator

```javascript
// ❌ NEVER DO THIS
const getOrdersSchema = {
  query: Joi.object({
    restaurantId: Joi.string().uuid().optional(), // ❌ Security vulnerability!
    status: Joi.string().optional(),
  })
};
```

## Frontend Considerations

### ✅ CORRECT Frontend

```typescript
// Frontend should NEVER send restaurantId
const getOrders = async (filters: OrderFilters) => {
  return apiClient.get('/api/orders', {
    params: {
      status: filters.status,
      // ❌ NO restaurantId in request
    }
  });
};
```

### ❌ WRONG Frontend

```typescript
// ❌ NEVER DO THIS
const getOrders = async (filters: OrderFilters) => {
  return apiClient.get('/api/orders', {
    params: {
      restaurantId: filters.restaurantId, // ❌ Security vulnerability!
      status: filters.status,
    }
  });
};
```

## Testing Security

### Test Cases to Verify

1. **User cannot access other restaurant's data**:
   ```javascript
   // User from Restaurant A tries to access Restaurant B's orders
   // Should return empty array or 403 Forbidden
   ```

2. **User cannot modify other restaurant's data**:
   ```javascript
   // User from Restaurant A tries to update Restaurant B's order
   // Should return 403 Forbidden
   ```

3. **restaurantId in request is ignored**:
   ```javascript
   // Even if client sends restaurantId, server uses JWT value
   // Should use restaurantId from JWT, not from request
   ```

## Common Mistakes

### Mistake 1: Accepting restaurantId as Optional
```javascript
// ❌ WRONG
const restaurantId = req.body.restaurantId || req.restaurantId;
```

### Mistake 2: Allowing restaurantId in Validators
```javascript
// ❌ WRONG
restaurantId: Joi.string().uuid().optional()
```

### Mistake 3: Using restaurantId from Query Params
```javascript
// ❌ WRONG
const { restaurantId } = req.query;
```

## Enforcement Checklist

When reviewing code, ensure:

- [ ] No `restaurantId` in request validators
- [ ] No `restaurantId` extracted from `req.query`
- [ ] No `restaurantId` extracted from `req.body`
- [ ] No `restaurantId` extracted from `req.params`
- [ ] All queries use `req.restaurantId` from JWT
- [ ] Frontend never sends `restaurantId` in requests
- [ ] Tests verify restaurant isolation

## Related Documentation

- [Security Overview](./01-security-overview.md)
- [Authentication Flow](./03-authentication-flow.md)
- [API Security](./05-api-security.md)


