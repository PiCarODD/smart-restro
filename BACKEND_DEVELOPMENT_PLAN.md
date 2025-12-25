# Backend Development Plan - Smart Restaurant Management System

## 📋 Overview

This plan outlines the phased implementation of the Node.js/Express backend with PostgreSQL database, building on the existing frontend.

---

## 🏗️ Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 20.x LTS |
| Framework | Express.js | 4.x |
| Database | PostgreSQL | 15+ |
| ORM | Sequelize | 6.x |
| Authentication | JWT + bcrypt | - |
| Real-time | Socket.IO | 4.x |
| Validation | Joi / Zod | - |
| File Upload | Multer + AWS S3 | - |
| Email | Nodemailer | - |
| Testing | Jest + Supertest | - |
| Documentation | Swagger/OpenAPI | - |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js         # Sequelize configuration
│   │   ├── auth.js             # JWT configuration
│   │   ├── cors.js             # CORS settings
│   │   ├── socket.js           # Socket.IO config
│   │   └── index.js            # Export all configs
│   │
│   ├── models/
│   │   ├── index.js            # Model associations
│   │   ├── Tenant.js
│   │   ├── Restaurant.js
│   │   ├── User.js
│   │   ├── Table.js
│   │   ├── Section.js
│   │   ├── MenuCategory.js
│   │   ├── MenuItem.js
│   │   ├── Ingredient.js
│   │   ├── IngredientCategory.js
│   │   ├── Recipe.js
│   │   ├── Order.js
│   │   ├── OrderItem.js
│   │   ├── Payment.js
│   │   ├── InventoryTransaction.js
│   │   ├── Tax.js
│   │   ├── FeatureToggle.js
│   │   └── AuditLog.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── restaurantController.js
│   │   ├── userController.js
│   │   ├── tableController.js
│   │   ├── sectionController.js
│   │   ├── menuController.js
│   │   ├── inventoryController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   ├── reportController.js
│   │   └── settingsController.js
│   │
│   ├── services/
│   │   ├── authService.js
│   │   ├── orderService.js
│   │   ├── inventoryService.js
│   │   ├── recipeService.js
│   │   ├── reportService.js
│   │   └── notificationService.js
│   │
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   ├── rbac.js             # Role-based access control
│   │   ├── validate.js         # Request validation
│   │   ├── errorHandler.js     # Global error handling
│   │   ├── rateLimiter.js      # Rate limiting
│   │   ├── audit.js            # Audit logging
│   │   └── tenant.js           # Multi-tenant middleware
│   │
│   ├── routes/
│   │   ├── index.js            # Route aggregator
│   │   ├── auth.js
│   │   ├── restaurants.js
│   │   ├── users.js
│   │   ├── tables.js
│   │   ├── sections.js
│   │   ├── menu.js
│   │   ├── inventory.js
│   │   ├── orders.js
│   │   ├── payments.js
│   │   ├── reports.js
│   │   └── settings.js
│   │
│   ├── sockets/
│   │   ├── index.js            # Socket.IO setup
│   │   ├── kdsSocket.js        # KDS real-time updates
│   │   ├── orderSocket.js      # Order status updates
│   │   └── tableSocket.js      # Table status updates
│   │
│   ├── utils/
│   │   ├── logger.js           # Winston logger
│   │   ├── helpers.js          # Utility functions
│   │   ├── constants.js        # App constants
│   │   └── errors.js           # Custom error classes
│   │
│   ├── validators/
│   │   ├── authValidator.js
│   │   ├── menuValidator.js
│   │   ├── orderValidator.js
│   │   └── inventoryValidator.js
│   │
│   └── app.js                  # Express app setup
│
├── migrations/                 # Sequelize migrations
├── seeders/                    # Sample data seeders
├── tests/                      # Jest tests
├── .env.example
├── .sequelizerc
└── package.json
```

---

## 📊 Database Schema Summary

### Core Tables (14 tables)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ENTITIES                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  🏢 MULTI-TENANT                                                     │
│  ├── tenants              # SaaS tenants                            │
│  └── restaurants          # Tenant's restaurants                    │
│                                                                      │
│  👥 USERS & AUTH                                                     │
│  ├── users                # Staff accounts                          │
│  └── sessions             # Login sessions (optional)               │
│                                                                      │
│  🪑 FLOOR MANAGEMENT                                                 │
│  ├── sections             # Floor sections (Main, Patio, etc.)      │
│  └── tables               # Restaurant tables                       │
│                                                                      │
│  🍽️ MENU                                                             │
│  ├── menu_categories      # Food categories                         │
│  ├── menu_items           # Individual dishes                       │
│  ├── recipes              # Menu item ↔ Ingredient mapping         │
│                                                                      │
│  📦 INVENTORY                                                        │
│  ├── ingredient_categories # Ingredient groupings                   │
│  ├── ingredients          # Raw materials                           │
│  └── inventory_transactions # Stock movements                       │
│                                                                      │
│  📝 ORDERS                                                           │
│  ├── orders               # Customer orders                         │
│  ├── order_items          # Line items in orders                    │
│  └── payments             # Payment records                         │
│                                                                      │
│  ⚙️ SETTINGS                                                         │
│  ├── taxes                # Tax configurations                      │
│  ├── feature_toggles     # Feature flags                            │
│  └── audit_logs          # Activity logging                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Development Phases

---

## Phase 1: Project Setup & Core Infrastructure (Week 1)

### 1.1 Initialize Project

```bash
mkdir backend && cd backend
npm init -y
npm install express cors helmet morgan dotenv
npm install sequelize pg pg-hstore
npm install bcryptjs jsonwebtoken
npm install joi multer
npm install socket.io
npm install -D nodemon sequelize-cli jest supertest
```

### 1.2 Tasks

| Task | Description | Priority |
|------|-------------|----------|
| Setup Express app | Base configuration | High |
| Configure Sequelize | Database connection | High |
| Create migrations | All 14+ tables | High |
| Setup environment | .env configuration | High |
| Error handling | Global middleware | High |
| Logger setup | Winston logging | Medium |

### 1.3 Database Creation

```sql
-- Create database
CREATE DATABASE smart_restaurant;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 1.4 Deliverables
- [ ] Express app running on port 3001
- [ ] PostgreSQL connected
- [ ] All migrations created and run
- [ ] Basic folder structure in place
- [ ] Environment variables configured

---

## Phase 2: Authentication & User Management (Week 2)

### 2.1 Models
- `Tenant`
- `Restaurant`
- `User`

### 2.2 API Endpoints

```
POST   /api/auth/register          # Register tenant + first user
POST   /api/auth/login             # Login with email/password
POST   /api/auth/login/pin         # Login with PIN (waiter app)
POST   /api/auth/logout            # Logout
POST   /api/auth/refresh           # Refresh JWT token
POST   /api/auth/forgot-password   # Request password reset
POST   /api/auth/reset-password    # Reset password
GET    /api/auth/me                # Get current user

GET    /api/users                  # List users (admin/manager)
POST   /api/users                  # Create user (admin/manager)
GET    /api/users/:id              # Get user details
PUT    /api/users/:id              # Update user
DELETE /api/users/:id              # Deactivate user
PUT    /api/users/:id/password     # Change user password
```

### 2.3 Middleware

```javascript
// JWT Authentication
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id);
    req.restaurantId = decoded.restaurantId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based Access Control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
```

### 2.4 Deliverables
- [ ] User registration & login working
- [ ] JWT token generation & validation
- [ ] Password hashing with bcrypt
- [ ] Role-based access control
- [ ] PIN login for waiter app

---

## Phase 3: Restaurant Settings & Configuration (Week 3)

### 3.1 Models
- `Restaurant` (settings JSONB)
- `Tax`
- `FeatureToggle`

### 3.2 API Endpoints

```
GET    /api/restaurants/:id                 # Get restaurant details
PUT    /api/restaurants/:id                 # Update restaurant
PUT    /api/restaurants/:id/settings        # Update settings
PUT    /api/restaurants/:id/logo            # Upload logo

GET    /api/taxes                           # List taxes
POST   /api/taxes                           # Create tax
PUT    /api/taxes/:id                       # Update tax
DELETE /api/taxes/:id                       # Delete tax

GET    /api/features                        # List feature toggles
PUT    /api/features/:id                    # Toggle feature
```

### 3.3 Settings Schema

```javascript
const settingsSchema = {
  features: {
    kds: { enabled: Boolean, stations: [String] },
    waiterApp: { enabled: Boolean },
    inventory: { enabled: Boolean, autoDeduction: Boolean },
    reservations: { enabled: Boolean },
  },
  operations: {
    currency: String,        // MMK, USD, etc.
    timezone: String,        // Asia/Yangon
    taxInclusive: Boolean,
  },
  appearance: {
    theme: String,           // light, dark, system
    kdsTheme: String,
  }
};
```

### 3.4 Deliverables
- [ ] Restaurant CRUD operations
- [ ] Settings management
- [ ] Tax configuration
- [ ] Feature toggles working
- [ ] Logo upload (file storage)

---

## Phase 4: Tables & Floor Management (Week 4)

### 4.1 Models
- `Section`
- `Table`

### 4.2 API Endpoints

```
# Sections
GET    /api/sections                  # List sections
POST   /api/sections                  # Create section
PUT    /api/sections/:id              # Update section
DELETE /api/sections/:id              # Delete section
PUT    /api/sections/reorder          # Reorder sections

# Tables
GET    /api/tables                    # List tables
GET    /api/tables/:id                # Get table with current order
POST   /api/tables                    # Create table
PUT    /api/tables/:id                # Update table
DELETE /api/tables/:id                # Delete table
PUT    /api/tables/:id/status         # Update status
GET    /api/tables/:id/orders         # Get table order history
```

### 4.3 Real-time Events (Socket.IO)

```javascript
// Table status changes
socket.emit('table:status_changed', { 
  tableId, 
  status, 
  orderId, 
  guestCount 
});

// Broadcast to all connected clients
io.to(`restaurant:${restaurantId}`).emit('tables:updated');
```

### 4.4 Deliverables
- [ ] Section CRUD with color/icon
- [ ] Table CRUD with section assignment
- [ ] Table status management
- [ ] Real-time table updates via Socket.IO

---

## Phase 5: Menu Management (Week 5)

### 5.1 Models
- `MenuCategory`
- `MenuItem`

### 5.2 API Endpoints

```
# Categories
GET    /api/menu/categories                 # List categories
POST   /api/menu/categories                 # Create category
PUT    /api/menu/categories/:id             # Update category
DELETE /api/menu/categories/:id             # Delete category
PUT    /api/menu/categories/reorder         # Reorder categories

# Menu Items
GET    /api/menu/items                      # List items (with filters)
GET    /api/menu/items/:id                  # Get item details
POST   /api/menu/items                      # Create item
PUT    /api/menu/items/:id                  # Update item
DELETE /api/menu/items/:id                  # Delete item
PUT    /api/menu/items/:id/availability     # Toggle availability
PUT    /api/menu/items/:id/image            # Upload image
GET    /api/menu/items/:id/recipe           # Get recipe
PUT    /api/menu/items/:id/recipe           # Update recipe
```

### 5.3 Query Filters

```javascript
// GET /api/menu/items?category=cat-1&available=true&search=rice
const where = {};
if (category) where.categoryId = category;
if (available !== undefined) where.isAvailable = available;
if (search) where.name = { [Op.iLike]: `%${search}%` };
```

### 5.4 Deliverables
- [ ] Category CRUD with display order
- [ ] Menu item CRUD with variants/modifiers
- [ ] Image upload for items
- [ ] Recipe linking (ingredients)
- [ ] Search and filtering

---

## Phase 6: Inventory Management (Week 6)

### 6.1 Models
- `IngredientCategory`
- `Ingredient`
- `Recipe`
- `InventoryTransaction`

### 6.2 API Endpoints

```
# Ingredient Categories
GET    /api/inventory/categories            # List categories
POST   /api/inventory/categories            # Create category
PUT    /api/inventory/categories/:id        # Update category
DELETE /api/inventory/categories/:id        # Delete category

# Ingredients
GET    /api/inventory/ingredients           # List ingredients
POST   /api/inventory/ingredients           # Create ingredient
PUT    /api/inventory/ingredients/:id       # Update ingredient
DELETE /api/inventory/ingredients/:id       # Delete ingredient
PUT    /api/inventory/ingredients/:id/stock # Adjust stock

# Stock Operations
POST   /api/inventory/stock-take            # Record stock take
GET    /api/inventory/low-stock             # Get low stock alerts
GET    /api/inventory/transactions          # Stock movement history

# Recipes
GET    /api/recipes/:menuItemId             # Get recipe for item
PUT    /api/recipes/:menuItemId             # Save/update recipe
DELETE /api/recipes/:menuItemId             # Delete recipe
GET    /api/recipes/:menuItemId/cost        # Calculate recipe cost
```

### 6.3 Auto Stock Deduction Service

```javascript
// services/inventoryService.js
async deductStockForOrder(orderId) {
  const order = await Order.findByPk(orderId, {
    include: [{ model: OrderItem }]
  });
  
  const transaction = await sequelize.transaction();
  
  try {
    for (const item of order.OrderItems) {
      const recipe = await Recipe.findAll({
        where: { menuItemId: item.menuItemId }
      });
      
      for (const ingredient of recipe) {
        const qty = ingredient.quantity * item.quantity * ingredient.wasteFactor;
        
        await Ingredient.decrement('currentStock', {
          by: qty,
          where: { id: ingredient.ingredientId },
          transaction
        });
        
        await InventoryTransaction.create({
          ingredientId: ingredient.ingredientId,
          transactionType: 'order_deduction',
          quantityChange: -qty,
          referenceType: 'order',
          referenceId: orderId,
        }, { transaction });
      }
    }
    
    await order.update({ stockDeducted: true }, { transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

### 6.4 Deliverables
- [ ] Ingredient CRUD with categories
- [ ] Stock adjustment operations
- [ ] Recipe builder (menu ↔ ingredients)
- [ ] Auto stock deduction on order completion
- [ ] Low stock alerts
- [ ] Transaction history

---

## Phase 7: Order Management (Week 7-8)

### 7.1 Models
- `Order`
- `OrderItem`

### 7.2 API Endpoints

```
# Orders
GET    /api/orders                          # List orders (with filters)
GET    /api/orders/:id                      # Get order details
POST   /api/orders                          # Create order
PUT    /api/orders/:id                      # Update order
PUT    /api/orders/:id/status               # Update status
DELETE /api/orders/:id                      # Cancel order

# Order Items
POST   /api/orders/:id/items                # Add item to order
PUT    /api/orders/:id/items/:itemId        # Update item
DELETE /api/orders/:id/items/:itemId        # Remove item
PUT    /api/orders/:id/items/:itemId/status # KDS: Update item status

# Quick Actions
POST   /api/orders/:id/send-to-kitchen      # Send order to KDS
POST   /api/orders/:id/split                # Split bill
POST   /api/orders/:id/transfer             # Transfer to another table
POST   /api/orders/:id/merge                # Merge with another order
```

### 7.3 Order Status Flow

```
┌─────────┐    ┌───────────┐    ┌───────────┐    ┌───────┐    ┌───────────┐
│ pending │───>│ confirmed │───>│ preparing │───>│ ready │───>│ completed │
└─────────┘    └───────────┘    └───────────┘    └───────┘    └───────────┘
     │                                                              
     └──────────────────────────────────────────────────────>┌───────────┐
                                                             │ cancelled │
                                                             └───────────┘
```

### 7.4 Real-time Events

```javascript
// Order created
io.to(`restaurant:${restaurantId}`).emit('order:created', order);

// Order item status changed (KDS)
io.to(`kds:${restaurantId}`).emit('order:item_updated', {
  orderId,
  itemId,
  status
});

// Order ready notification
io.to(`waiter:${waiterId}`).emit('order:ready', {
  orderId,
  tableId,
  tableName
});
```

### 7.5 Deliverables
- [ ] Order CRUD operations
- [ ] Order item management
- [ ] Status workflow
- [ ] Real-time KDS updates
- [ ] Order totals calculation (subtotal, tax, total)
- [ ] Waiter notifications

---

## Phase 8: Payments (Week 8)

### 8.1 Models
- `Payment`

### 8.2 API Endpoints

```
POST   /api/orders/:id/payments             # Process payment
GET    /api/orders/:id/payments             # Get payments for order
POST   /api/payments/:id/refund             # Refund payment

GET    /api/payments                        # List all payments
GET    /api/payments/daily-summary          # Daily totals
```

### 8.3 Payment Processing

```javascript
async processPayment(orderId, paymentData) {
  const { method, amount, tipAmount } = paymentData;
  
  const order = await Order.findByPk(orderId);
  const totalDue = order.totalAmount - order.paidAmount;
  
  if (amount < totalDue) {
    // Partial payment
    order.paymentStatus = 'partial';
  } else {
    // Full payment
    order.paymentStatus = 'paid';
    order.status = 'completed';
    
    // Trigger stock deduction
    await inventoryService.deductStockForOrder(orderId);
    
    // Update table status
    await Table.update(
      { status: 'cleaning', currentOrderId: null },
      { where: { id: order.tableId } }
    );
  }
  
  const payment = await Payment.create({
    orderId,
    amount,
    tipAmount,
    totalAmount: amount + tipAmount,
    paymentMethod: method,
    status: 'completed',
    processedBy: req.user.id,
  });
  
  await order.save();
  return payment;
}
```

### 8.4 Deliverables
- [ ] Payment processing
- [ ] Multiple payment methods
- [ ] Split payments
- [ ] Tip handling
- [ ] Refunds
- [ ] Daily summary

---

## Phase 9: KDS (Kitchen Display System) (Week 9)

### 9.1 Real-time Architecture

```javascript
// sockets/kdsSocket.js
module.exports = (io) => {
  const kdsNamespace = io.of('/kds');
  
  kdsNamespace.on('connection', (socket) => {
    const { restaurantId, station } = socket.handshake.query;
    
    // Join restaurant room
    socket.join(`restaurant:${restaurantId}`);
    
    // Join station-specific room if specified
    if (station) {
      socket.join(`station:${restaurantId}:${station}`);
    }
    
    // Handle item status updates from KDS
    socket.on('item:start', async ({ orderId, itemId }) => {
      await OrderItem.update(
        { status: 'preparing', startedAt: new Date() },
        { where: { id: itemId } }
      );
      
      kdsNamespace.to(`restaurant:${restaurantId}`)
        .emit('item:updated', { orderId, itemId, status: 'preparing' });
    });
    
    socket.on('item:ready', async ({ orderId, itemId }) => {
      await OrderItem.update(
        { status: 'ready', readyAt: new Date() },
        { where: { id: itemId } }
      );
      
      // Check if all items ready
      const order = await checkOrderReady(orderId);
      
      kdsNamespace.to(`restaurant:${restaurantId}`)
        .emit('item:updated', { orderId, itemId, status: 'ready' });
      
      if (order.allItemsReady) {
        // Notify waiter
        io.to(`waiter:${order.waiterId}`).emit('order:ready', {
          orderId,
          tableName: order.tableName
        });
      }
    });
    
    socket.on('order:bump', async ({ orderId }) => {
      // Mark order as served/completed from KDS
    });
  });
};
```

### 9.2 API Endpoints

```
GET    /api/kds/orders                      # Get active orders for KDS
GET    /api/kds/orders?station=grill        # Filter by station
PUT    /api/kds/items/:id/status            # Update item status
POST   /api/kds/orders/:id/bump             # Bump order (complete)
GET    /api/kds/history                     # Recent completed orders
```

### 9.3 Deliverables
- [ ] Real-time order display
- [ ] Station filtering
- [ ] Item status workflow (pending → preparing → ready)
- [ ] Bump functionality
- [ ] Order timing/priority colors
- [ ] Sound notifications

---

## Phase 10: Reports & Analytics (Week 10)

### 10.1 API Endpoints

```
# Sales Reports
GET    /api/reports/sales/daily             # Daily sales
GET    /api/reports/sales/weekly            # Weekly summary
GET    /api/reports/sales/monthly           # Monthly summary
GET    /api/reports/sales/by-category       # Sales by category
GET    /api/reports/sales/by-item           # Top selling items
GET    /api/reports/sales/by-hour           # Hourly breakdown

# Staff Reports
GET    /api/reports/staff/performance       # Staff metrics
GET    /api/reports/staff/tips              # Tips summary

# Inventory Reports
GET    /api/reports/inventory/usage         # Ingredient usage
GET    /api/reports/inventory/cost          # Food cost analysis
GET    /api/reports/inventory/waste         # Waste tracking

# Payment Reports
GET    /api/reports/payments/by-method      # Payment method breakdown
GET    /api/reports/payments/tips           # Tips analysis
```

### 10.2 Report Service

```javascript
// services/reportService.js
async getDailySales(restaurantId, date) {
  const result = await Order.findAll({
    where: {
      restaurantId,
      status: 'completed',
      completedAt: {
        [Op.gte]: startOfDay(date),
        [Op.lte]: endOfDay(date)
      }
    },
    attributes: [
      [fn('SUM', col('subtotal')), 'subtotal'],
      [fn('SUM', col('taxAmount')), 'tax'],
      [fn('SUM', col('discountAmount')), 'discount'],
      [fn('SUM', col('tipAmount')), 'tips'],
      [fn('SUM', col('totalAmount')), 'total'],
      [fn('COUNT', col('id')), 'orderCount'],
    ],
    raw: true
  });
  
  return result[0];
}
```

### 10.3 Deliverables
- [ ] Daily/weekly/monthly sales reports
- [ ] Category and item sales breakdown
- [ ] Staff performance metrics
- [ ] Inventory usage reports
- [ ] Payment method analysis
- [ ] Export to CSV/PDF

---

## Phase 11: Waiter App Backend (Week 11)

### 11.1 API Endpoints

```
# Waiter-specific endpoints
POST   /api/waiter/login                    # PIN-based login
GET    /api/waiter/tables                   # Get assigned tables
GET    /api/waiter/orders                   # Get waiter's active orders
POST   /api/waiter/orders                   # Create order from table
GET    /api/waiter/notifications            # Get notifications
PUT    /api/waiter/notifications/:id/read   # Mark as read
```

### 11.2 Push Notifications

```javascript
// When order is ready
const sendWaiterNotification = async (waiterId, notification) => {
  // Save to database
  await Notification.create({
    userId: waiterId,
    type: 'order_ready',
    title: notification.title,
    message: notification.message,
    data: notification.data,
  });
  
  // Send via Socket.IO
  io.to(`waiter:${waiterId}`).emit('notification', notification);
  
  // Optional: Send push notification if web push enabled
};
```

### 11.3 Deliverables
- [ ] PIN authentication
- [ ] Table assignment
- [ ] Order creation from mobile
- [ ] Real-time notifications
- [ ] Order status tracking

---

## Phase 12: Testing & Documentation (Week 12)

### 12.1 Test Coverage

```javascript
// tests/orders.test.js
describe('Order API', () => {
  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tableId: 'table-1',
          items: [
            { menuItemId: 'item-1', quantity: 2 }
          ]
        });
      
      expect(res.status).toBe(201);
      expect(res.body.orderNumber).toBeDefined();
    });
  });
  
  describe('Stock Deduction', () => {
    it('should deduct ingredients on payment', async () => {
      // Create order, pay, check stock levels
    });
  });
});
```

### 12.2 API Documentation (Swagger)

```javascript
// config/swagger.js
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Restaurant API',
      version: '1.0.0',
      description: 'Restaurant Management System API'
    },
    servers: [
      { url: 'http://localhost:3001/api' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};
```

### 12.3 Deliverables
- [ ] Unit tests for services
- [ ] Integration tests for APIs
- [ ] API documentation (Swagger)
- [ ] Deployment documentation
- [ ] Environment setup guide

---

## 📦 Database Migrations

### Migration Order

```
001_create_tenants
002_create_restaurants
003_create_users
004_create_sections
005_create_tables
006_create_menu_categories
007_create_menu_items
008_create_ingredient_categories
009_create_ingredients
010_create_recipes
011_create_orders
012_create_order_items
013_create_payments
014_create_inventory_transactions
015_create_taxes
016_create_feature_toggles
017_create_audit_logs
018_create_notifications
```

### Sample Migration

```javascript
// migrations/006_create_menu_items.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('menu_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      restaurant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'restaurants', key: 'id' },
        onDelete: 'CASCADE'
      },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'menu_categories', key: 'id' },
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: Sequelize.TEXT,
      base_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      cost_price: Sequelize.DECIMAL(10, 2),
      variants: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      modifiers: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      image_url: Sequelize.STRING(500),
      allergens: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: []
      },
      dietary_tags: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        defaultValue: []
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('menu_items', ['restaurant_id']);
    await queryInterface.addIndex('menu_items', ['category_id']);
    await queryInterface.addIndex('menu_items', ['is_active', 'is_available']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('menu_items');
  }
};
```

---

## 🔐 Security Checklist

- [ ] JWT tokens with expiration
- [ ] Password hashing (bcrypt)
- [ ] Rate limiting on auth endpoints
- [ ] Input validation (Joi/Zod)
- [ ] SQL injection prevention (Sequelize)
- [ ] XSS prevention (sanitize outputs)
- [ ] CORS configuration
- [ ] Helmet security headers
- [ ] Audit logging
- [ ] Role-based access control

---

## 📅 Timeline Summary

| Phase | Description | Duration |
|-------|-------------|----------|
| 1 | Project Setup & Infrastructure | 1 week |
| 2 | Authentication & Users | 1 week |
| 3 | Restaurant Settings | 1 week |
| 4 | Tables & Floor Management | 1 week |
| 5 | Menu Management | 1 week |
| 6 | Inventory Management | 1 week |
| 7 | Order Management | 2 weeks |
| 8 | Payments | 1 week |
| 9 | KDS Real-time | 1 week |
| 10 | Reports & Analytics | 1 week |
| 11 | Waiter App Backend | 1 week |
| 12 | Testing & Documentation | 1 week |
| **Total** | | **13 weeks** |

---

## 🚀 Ready to Start?

Begin with Phase 1: Project Setup!

```bash
cd C:\Users\heinp\Desktop\Project\smart-restaurent
mkdir backend
cd backend
npm init -y
```

