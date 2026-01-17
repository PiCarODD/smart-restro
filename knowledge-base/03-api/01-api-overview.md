# API Overview

## Base URL

```
Development: http://localhost:3001/api
Production: https://api.smartresto.com/api
```

## Authentication

All API requests (except login/register) require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Token Structure
JWT tokens contain:
- `userId`: User ID
- `restaurantId`: Restaurant ID (for multi-tenant isolation)
- `role`: User role
- `email`: User email
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}
```

## HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

## API Endpoints by Category

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/forgot-password` - Request password reset

### Restaurants
- `GET /restaurants` - Get restaurant details
- `PUT /restaurants/:id` - Update restaurant
- `POST /restaurants/:id/logo` - Upload logo

### Users
- `GET /users` - List users
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Tables
- `GET /tables` - List tables
- `POST /tables` - Create table
- `PUT /tables/:id` - Update table
- `DELETE /tables/:id` - Delete table
- `PATCH /tables/:id/status` - Update table status
- `GET /tables/:id/qr-code` - Get table QR code

### Menu
- `GET /menu/categories` - List categories
- `POST /menu/categories` - Create category
- `PUT /menu/categories/:id` - Update category
- `DELETE /menu/categories/:id` - Delete category
- `GET /menu/items` - List menu items
- `POST /menu/items` - Create menu item
- `PUT /menu/items/:id` - Update menu item
- `DELETE /menu/items/:id` - Delete menu item

### Orders
- `GET /orders` - List orders
- `POST /orders` - Create order
- `GET /orders/:id` - Get order details
- `PATCH /orders/:id` - Update order
- `PATCH /orders/:id/status` - Update order status
- `POST /orders/:id/items` - Add items to order
- `DELETE /orders/:id/items/:itemId` - Remove item
- `POST /orders/:id/payment` - Process payment

### Inventory
- `GET /inventory/ingredients` - List ingredients
- `POST /inventory/ingredients` - Create ingredient
- `PUT /inventory/ingredients/:id` - Update ingredient
- `DELETE /inventory/ingredients/:id` - Delete ingredient
- `POST /inventory/adjust` - Adjust stock
- `GET /inventory/transactions` - Get transaction history
- `GET /inventory/recipes/:menuItemId` - Get recipe
- `POST /inventory/recipes` - Create/update recipe

### KDS (Kitchen Display System)
- `GET /kds/orders` - Get active orders for KDS
- `PATCH /kds/orders/:orderId/items/:itemId/status` - Update item status
- `PATCH /kds/orders/:orderId/status` - Update order status

### Reports
- `GET /reports/sales` - Sales report
- `GET /reports/inventory` - Inventory report
- `GET /reports/staff-performance` - Staff performance
- `GET /reports/financial` - Financial report

### Waiter App
- `GET /waiter/tables` - Get waiter's tables
- `GET /waiter/orders` - Get waiter's orders
- `POST /waiter/orders` - Create order (waiter)

## Request Validation

All requests are validated using Joi validators:
- Request body validation
- Query parameter validation
- URL parameter validation

Validation errors return `422 Unprocessable Entity` with details.

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Authentication endpoints**: 5 requests per minute
- **General endpoints**: 100 requests per minute
- **File upload endpoints**: 10 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## Filtering & Sorting

Many list endpoints support filtering and sorting:

**Query Parameters**:
- `search`: Search term
- `status`: Filter by status
- `sortBy`: Sort field
- `sortOrder`: `asc` or `desc`

**Example**:
```
GET /api/orders?status=pending&sortBy=createdAt&sortOrder=desc
```

## Error Handling

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `UNAUTHORIZED`: Missing or invalid token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ENTRY`: Resource already exists
- `INSUFFICIENT_STOCK`: Not enough stock for operation
- `INVALID_STATUS`: Invalid status transition

### Error Response Example
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Email is required",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

## Security Considerations

### Restaurant ID Security
**CRITICAL**: `restaurantId` is **NEVER** accepted from client requests. It is always extracted from the JWT token via `req.restaurantId` set by authentication middleware.

**Why?** Prevents IDOR (Insecure Direct Object Reference) attacks.

### Input Sanitization
- All user inputs are validated
- SQL injection prevented via Sequelize ORM
- XSS protection via input sanitization

### CORS
CORS is configured to allow requests only from authorized origins:
- Development: `http://localhost:5173`
- Production: Configured domain

## Related Documentation

- [Authentication API](./02-authentication.md)
- [Order API](./03-orders-api.md)
- [Inventory API](./04-inventory-api.md)
- [Security Guidelines](../05-security/01-security-overview.md)


