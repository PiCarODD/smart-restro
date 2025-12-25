# API Documentation

## Base URL
```
Production: https://api.smartresto.com/v1
Development: http://localhost:3001/api
```

## Authentication

All API requests (except login/register) require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Auth Endpoints

#### POST /auth/login
Login and receive JWT token.

**Request:**
```json
{
  "email": "user@restaurant.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@restaurant.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "manager"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": 604800
  }
}
```

#### POST /auth/register
Register a new account (creates tenant).

#### POST /auth/refresh
Refresh access token using refresh token.

#### POST /auth/logout
Invalidate current tokens.

#### POST /auth/forgot-password
Request password reset email.

#### POST /auth/reset-password
Reset password with token.

---

## Menu Endpoints

### Categories

#### GET /menu/categories
Get all menu categories.

**Query Parameters:**
- `active` (boolean): Filter by active status
- `include` (string): Include relations (`items`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Main Course",
      "description": "Our signature dishes",
      "imageUrl": "https://...",
      "displayOrder": 1,
      "isActive": true,
      "itemCount": 15,
      "kdsStation": "Grill"
    }
  ]
}
```

#### POST /menu/categories
Create a new category.

**Request:**
```json
{
  "name": "Appetizers",
  "description": "Start your meal right",
  "displayOrder": 0,
  "kdsStation": "Fryer"
}
```

#### PUT /menu/categories/:id
Update a category.

#### DELETE /menu/categories/:id
Delete a category.

---

### Menu Items

#### GET /menu/items
Get all menu items.

**Query Parameters:**
- `categoryId` (uuid): Filter by category
- `active` (boolean): Filter by active status
- `available` (boolean): Filter by availability
- `search` (string): Search by name
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Fried Rice",
        "description": "Classic Thai fried rice",
        "basePrice": 7.99,
        "costPrice": 2.24,
        "category": {
          "id": "uuid",
          "name": "Main Course"
        },
        "variants": [
          { "name": "Small", "price": 5.99 },
          { "name": "Large", "price": 9.99 }
        ],
        "modifiers": [
          { "name": "Extra Spicy", "price": 0 },
          { "name": "Add Shrimp", "price": 3.00 }
        ],
        "imageUrl": "https://...",
        "allergens": ["gluten", "soy"],
        "dietaryTags": ["gluten-free-option"],
        "isActive": true,
        "isAvailable": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

#### POST /menu/items
Create a new menu item.

**Request:**
```json
{
  "categoryId": "uuid",
  "name": "Tom Yum Soup",
  "description": "Spicy and sour Thai soup",
  "basePrice": 8.99,
  "variants": [
    { "name": "Small", "price": 6.99 },
    { "name": "Regular", "price": 8.99 },
    { "name": "Large", "price": 11.99 }
  ],
  "modifiers": [
    { "name": "Extra Spicy", "price": 0 },
    { "name": "Add Seafood", "price": 4.00 }
  ],
  "allergens": ["shellfish"],
  "dietaryTags": ["gluten-free"],
  "kdsStation": "Soup Station"
}
```

#### GET /menu/items/:id
Get a single menu item with full details.

#### PUT /menu/items/:id
Update a menu item.

#### DELETE /menu/items/:id
Delete a menu item (soft delete).

#### PATCH /menu/items/:id/availability
Toggle item availability (86'd).

**Request:**
```json
{
  "isAvailable": false
}
```

---

## Order Endpoints

#### GET /orders
Get orders list.

**Query Parameters:**
- `status` (string): Filter by status
- `tableId` (uuid): Filter by table
- `waiterId` (uuid): Filter by waiter
- `date` (date): Filter by date
- `dateFrom` (date): Filter from date
- `dateTo` (date): Filter to date
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "#142",
        "orderType": "dine_in",
        "status": "preparing",
        "table": {
          "id": "uuid",
          "tableNumber": "5"
        },
        "waiter": {
          "id": "uuid",
          "firstName": "John"
        },
        "guestCount": 4,
        "items": [
          {
            "id": "uuid",
            "itemName": "Fried Rice",
            "quantity": 2,
            "unitPrice": 7.99,
            "totalPrice": 15.98,
            "status": "preparing",
            "notes": "Extra spicy"
          }
        ],
        "subtotal": 36.94,
        "taxAmount": 2.96,
        "totalAmount": 39.90,
        "paymentStatus": "unpaid",
        "placedAt": "2024-12-21T14:30:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

#### POST /orders
Create a new order.

**Request:**
```json
{
  "tableId": "uuid",
  "guestCount": 4,
  "orderType": "dine_in",
  "items": [
    {
      "menuItemId": "uuid",
      "variantName": "Regular",
      "quantity": 2,
      "modifiers": [
        { "name": "Extra Spicy", "price": 0 }
      ],
      "notes": "No onion"
    }
  ],
  "notes": "Birthday celebration"
}
```

#### GET /orders/:id
Get a single order with full details.

#### PUT /orders/:id
Update an order (before confirmed).

#### PATCH /orders/:id/status
Update order status.

**Request:**
```json
{
  "status": "confirmed"
}
```

**Valid Status Transitions:**
- `pending` → `confirmed`
- `confirmed` → `preparing`
- `preparing` → `ready`
- `ready` → `served`
- `served` → `completed`
- Any → `cancelled`

#### POST /orders/:id/items
Add items to an existing order.

**Request:**
```json
{
  "items": [
    {
      "menuItemId": "uuid",
      "quantity": 1,
      "notes": "For dessert course"
    }
  ]
}
```

#### DELETE /orders/:id/items/:itemId
Remove an item from order.

---

## KDS Endpoints

#### GET /kds/orders
Get orders for Kitchen Display System.

**Query Parameters:**
- `station` (string): Filter by station
- `status` (string): Filter by status (pending, preparing)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderNumber": "#142",
      "tableNumber": "5",
      "waiterName": "John",
      "placedAt": "2024-12-21T14:30:00Z",
      "elapsedMinutes": 5,
      "priority": "normal",
      "items": [
        {
          "id": "uuid",
          "name": "Fried Rice",
          "quantity": 2,
          "modifiers": ["Extra Spicy"],
          "notes": "No onion",
          "status": "pending",
          "station": "Wok"
        }
      ]
    }
  ]
}
```

#### PATCH /kds/items/:itemId/status
Update item status (bump).

**Request:**
```json
{
  "status": "ready"
}
```

#### PATCH /kds/orders/:orderId/bump
Bump entire order (mark all items ready).

---

## Table Endpoints

#### GET /tables
Get all tables.

**Query Parameters:**
- `section` (string): Filter by section
- `status` (string): Filter by status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tableNumber": "5",
      "name": "Window Booth",
      "section": "Main Floor",
      "capacity": 4,
      "status": "occupied",
      "position": { "x": 100, "y": 200 },
      "currentOrder": {
        "id": "uuid",
        "orderNumber": "#142",
        "guestCount": 4,
        "totalAmount": 39.90,
        "occupiedSince": "2024-12-21T14:15:00Z"
      }
    }
  ]
}
```

#### POST /tables
Create a new table.

#### PUT /tables/:id
Update table details.

#### PATCH /tables/:id/status
Update table status.

**Request:**
```json
{
  "status": "cleaning"
}
```

#### GET /tables/:id/qr
Generate QR code for table.

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCodeUrl": "https://...",
    "externalLink": "https://resto.smartresto.com/w/abc123"
  }
}
```

---

## Inventory Endpoints

### Ingredients

#### GET /inventory/ingredients
Get all ingredients.

**Query Parameters:**
- `category` (string): Filter by category
- `lowStock` (boolean): Only show low stock items
- `search` (string): Search by name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Jasmine Rice",
      "sku": "RICE-001",
      "category": "Grains",
      "unit": "kg",
      "unitCost": 2.50,
      "currentStock": 15.5,
      "minimumStock": 10,
      "isLowStock": false,
      "supplierName": "Thai Foods Inc"
    }
  ]
}
```

#### POST /inventory/ingredients
Create a new ingredient.

#### PUT /inventory/ingredients/:id
Update an ingredient.

#### DELETE /inventory/ingredients/:id
Delete an ingredient.

---

### Recipes

#### GET /inventory/recipes/:menuItemId
Get recipe for a menu item.

**Response:**
```json
{
  "success": true,
  "data": {
    "menuItem": {
      "id": "uuid",
      "name": "Fried Rice",
      "basePrice": 7.99
    },
    "totalCost": 2.24,
    "foodCostPercentage": 28.0,
    "ingredients": [
      {
        "id": "uuid",
        "ingredientId": "uuid",
        "ingredientName": "Jasmine Rice",
        "quantity": 200,
        "unit": "g",
        "unitCost": 0.002,
        "totalCost": 0.40,
        "currentStock": 15500,
        "stockUnit": "g"
      }
    ]
  }
}
```

#### POST /inventory/recipes/:menuItemId
Set recipe for a menu item.

**Request:**
```json
{
  "ingredients": [
    {
      "ingredientId": "uuid",
      "quantity": 200,
      "unit": "g"
    },
    {
      "ingredientId": "uuid",
      "quantity": 100,
      "unit": "g"
    }
  ]
}
```

#### PUT /inventory/recipes/:menuItemId
Update recipe.

---

### Stock Operations

#### POST /inventory/adjust
Manual stock adjustment.

**Request:**
```json
{
  "ingredientId": "uuid",
  "quantityChange": -500,
  "reason": "waste",
  "notes": "Spoiled due to refrigerator malfunction"
}
```

#### POST /inventory/stock-take
Record stock take.

**Request:**
```json
{
  "items": [
    {
      "ingredientId": "uuid",
      "actualQuantity": 14.5
    }
  ],
  "notes": "Weekly stock take"
}
```

#### GET /inventory/transactions
Get inventory transaction history.

**Query Parameters:**
- `ingredientId` (uuid): Filter by ingredient
- `type` (string): Filter by transaction type
- `dateFrom` (date): From date
- `dateTo` (date): To date

---

## External/Waiter App Endpoints

These endpoints use table tokens instead of user authentication.

#### GET /external/table/:token
Get table info and menu via external link.

**Response:**
```json
{
  "success": true,
  "data": {
    "restaurant": {
      "name": "Thai Palace",
      "logo": "https://..."
    },
    "table": {
      "id": "uuid",
      "tableNumber": "5"
    },
    "menu": {
      "categories": [...],
      "items": [...]
    }
  }
}
```

#### POST /external/orders
Place order via external link.

**Request:**
```json
{
  "tableToken": "abc123",
  "waiterPin": "1234",
  "guestCount": 4,
  "items": [...]
}
```

#### GET /external/orders/:tableToken
Get current order for table.

---

## Payment Endpoints

#### POST /orders/:orderId/payments
Process payment.

**Request:**
```json
{
  "amount": 39.90,
  "tipAmount": 6.00,
  "paymentMethod": "card",
  "cardToken": "tok_visa"
}
```

#### POST /orders/:orderId/payments/split
Split payment.

**Request:**
```json
{
  "splits": [
    {
      "amount": 20.00,
      "paymentMethod": "card",
      "cardToken": "tok_visa"
    },
    {
      "amount": 25.90,
      "paymentMethod": "cash"
    }
  ]
}
```

#### POST /payments/:paymentId/refund
Refund payment.

**Request:**
```json
{
  "amount": 15.98,
  "reason": "Customer complaint - food quality"
}
```

---

## Reports Endpoints

#### GET /reports/sales
Get sales report.

**Query Parameters:**
- `dateFrom` (date): Required
- `dateTo` (date): Required
- `groupBy` (string): hour, day, week, month

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 15420.50,
      "totalOrders": 342,
      "averageOrderValue": 45.09,
      "totalTips": 1850.25
    },
    "byPeriod": [
      {
        "date": "2024-12-21",
        "revenue": 2140.50,
        "orders": 48,
        "averageOrderValue": 44.59
      }
    ],
    "topItems": [
      {
        "name": "Fried Rice",
        "quantity": 156,
        "revenue": 1245.44
      }
    ]
  }
}
```

#### GET /reports/inventory
Get inventory report.

#### GET /reports/staff-performance
Get staff performance report.

---

## WebSocket Events

### Connection
```javascript
const socket = io('wss://api.smartresto.com', {
  auth: { token: 'jwt_token' }
});
```

### Events (Server → Client)

| Event | Description | Payload |
|-------|-------------|---------|
| `order:new` | New order created | Order object |
| `order:updated` | Order status changed | Order object |
| `order:item:updated` | Item status changed | OrderItem object |
| `table:status:changed` | Table status changed | Table object |
| `stock:low` | Low stock alert | Ingredient object |
| `notification` | General notification | Notification object |

### Events (Client → Server)

| Event | Description | Payload |
|-------|-------------|---------|
| `join:restaurant` | Join restaurant room | `{ restaurantId }` |
| `join:kds` | Join KDS room | `{ station }` |

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or expired token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 10 requests/minute |
| API (Standard) | 100 requests/minute |
| API (Premium) | 500 requests/minute |
| WebSocket | 50 messages/second |

