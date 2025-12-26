# API Endpoint and Role Mapping Documentation

This document provides a comprehensive mapping of all API endpoints to user roles, specifying who can access which endpoints.

## Table of Contents

- [Role Definitions](#role-definitions)
- [Authentication Requirements](#authentication-requirements)
- [API Endpoints by Category](#api-endpoints-by-category)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Restaurants](#restaurants)
  - [Taxes](#taxes)
  - [Feature Toggles](#feature-toggles)
  - [Sections](#sections)
  - [Tables](#tables)
  - [Menu](#menu)
  - [Inventory](#inventory)
  - [Recipes](#recipes)
  - [Orders](#orders)
  - [KDS (Kitchen Display System)](#kds-kitchen-display-system)
  - [Reports & Analytics](#reports--analytics)
  - [Waiter App](#waiter-app)
  - [File Upload](#file-upload)
- [Role Summary Matrix](#role-summary-matrix)
- [Security Notes](#security-notes)

---

## Role Definitions

| Role | Description | Permissions Level |
|------|-------------|-------------------|
| `tenant_admin` | Highest level - manages entire tenant (restaurant group) | Full access to all endpoints |
| `admin` | Restaurant administrator - full control of restaurant | Full access to restaurant endpoints |
| `manager` | Restaurant manager - operational management | Most endpoints except user management |
| `waiter` / `server` | Service staff - handles orders and tables | Order creation, table management, waiter-specific endpoints |
| `cashier` | Handles payments and order completion | Order management, payment processing |
| `cook` | Kitchen staff - handles food preparation | KDS endpoints, order item status updates |
| `inventory` | Inventory manager | Inventory and ingredient management |

---

## Authentication Requirements

### Public Endpoints (No Authentication Required)
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/login/pin` - Login with PIN (waiter app)
- `GET /api/health` - Health check

**Note**: Registration and password reset are handled by administrators. Users cannot self-register or reset passwords.

### Protected Endpoints (Authentication Required)
All other endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

**Important Security Note**: The `restaurantId` is **never** accepted from client requests. It is always extracted from the JWT token (`req.restaurantId`) to prevent IDOR (Insecure Direct Object Reference) and BAC (Broken Access Control) attacks.

---

## API Endpoints by Category

### Authentication

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/login` | Public | Login with email/password |
| POST | `/api/auth/login/pin` | Public | Login with PIN (waiter app) |
| GET | `/api/auth/me` | Authenticated | Get current user info |
| POST | `/api/auth/refresh` | Authenticated | Refresh access token |
| POST | `/api/auth/logout` | Authenticated | Logout current session |

**Note**: User registration and password resets are handled by administrators through the `/api/users` endpoints. Regular users cannot self-register or reset passwords.

---

### Users

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/users` | `tenant_admin`, `admin`, `manager` | List all users |
| GET | `/api/users/:id` | `tenant_admin`, `admin`, `manager` | Get user by ID |
| POST | `/api/users` | `tenant_admin`, `admin`, `manager` | Create new user |
| PUT | `/api/users/:id` | `tenant_admin`, `admin`, `manager` | Update user |
| DELETE | `/api/users/:id` | `tenant_admin`, `admin`, `manager` | Delete user |
| PUT | `/api/users/:id/password` | `tenant_admin`, `admin`, `manager` | Change user password |

---

### Restaurants

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/restaurants` | `tenant_admin`, `admin`, `manager` | List restaurants (tenant_admin sees all in tenant) |
| GET | `/api/restaurants/me` | `tenant_admin`, `admin`, `manager` | Get current user's restaurant |
| PUT | `/api/restaurants/me` | `tenant_admin`, `admin`, `manager` | Update current restaurant |
| GET | `/api/restaurants/me/settings` | `tenant_admin`, `admin`, `manager` | Get restaurant settings |
| PUT | `/api/restaurants/me/settings` | `tenant_admin`, `admin`, `manager` | Update restaurant settings |
| PUT | `/api/restaurants/me/logo` | `tenant_admin`, `admin`, `manager` | Upload restaurant logo |

**Note**: Restaurant endpoints use `/me` instead of `/:id` for security. The restaurant ID is extracted from the JWT token.

---

### Taxes

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/taxes` | `tenant_admin`, `admin`, `manager` | List all taxes |
| POST | `/api/taxes/list` | `tenant_admin`, `admin`, `manager` | List taxes with filters (POST for CSRF protection) |
| GET | `/api/taxes/:id` | `tenant_admin`, `admin`, `manager` | Get tax by ID |
| POST | `/api/taxes` | `tenant_admin`, `admin`, `manager` | Create new tax |
| PUT | `/api/taxes/:id` | `tenant_admin`, `admin`, `manager` | Update tax |
| DELETE | `/api/taxes/:id` | `tenant_admin`, `admin`, `manager` | Delete tax |

---

### Feature Toggles

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/features` | `tenant_admin`, `admin`, `manager` | List all feature toggles |
| GET | `/api/features/:id` | `tenant_admin`, `admin`, `manager` | Get feature toggle by ID |
| PUT | `/api/features/:featureKey` | `tenant_admin`, `admin`, `manager` | Upsert feature toggle |
| PATCH | `/api/features/:id/toggle` | `tenant_admin`, `admin`, `manager` | Toggle feature on/off |
| DELETE | `/api/features/:id` | `tenant_admin`, `admin`, `manager` | Delete feature toggle |

---

### Sections

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/sections` | `tenant_admin`, `admin`, `manager` | List all sections |
| GET | `/api/sections/:id` | `tenant_admin`, `admin`, `manager` | Get section by ID |
| POST | `/api/sections` | `tenant_admin`, `admin`, `manager` | Create new section |
| PUT | `/api/sections/:id` | `tenant_admin`, `admin`, `manager` | Update section |
| DELETE | `/api/sections/:id` | `tenant_admin`, `admin`, `manager` | Delete section |
| PUT | `/api/sections/reorder` | `tenant_admin`, `admin`, `manager` | Reorder sections |

---

### Tables

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/tables` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | List all tables |
| GET | `/api/tables/:id` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | Get table by ID |
| GET | `/api/tables/:id/qr-code` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | Get table QR code |
| POST | `/api/tables` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | Create new table |
| PUT | `/api/tables/:id` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | Update table |
| DELETE | `/api/tables/:id` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | Delete table |
| PUT | `/api/tables/:id/status` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | Update table status |
| GET | `/api/tables/:id/orders` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | Get table order history |

---

### Menu

#### Categories

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/menu/categories` | **Authenticated** (all roles) | List all categories |
| GET | `/api/menu/categories/:id` | **Authenticated** (all roles) | Get category by ID |
| POST | `/api/menu/categories` | `tenant_admin`, `admin`, `manager` | Create new category |
| PUT | `/api/menu/categories/:id` | `tenant_admin`, `admin`, `manager` | Update category |
| DELETE | `/api/menu/categories/:id` | `tenant_admin`, `admin`, `manager` | Delete category |
| PUT | `/api/menu/categories/reorder` | `tenant_admin`, `admin`, `manager` | Reorder categories |

#### Menu Items

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/menu/items` | **Authenticated** (all roles) | List all menu items |
| GET | `/api/menu/items/:id` | **Authenticated** (all roles) | Get menu item by ID |
| POST | `/api/menu/items` | `tenant_admin`, `admin`, `manager` | Create new menu item |
| PUT | `/api/menu/items/:id` | `tenant_admin`, `admin`, `manager` | Update menu item |
| DELETE | `/api/menu/items/:id` | `tenant_admin`, `admin`, `manager` | Delete menu item |
| PUT | `/api/menu/items/:id/availability` | `tenant_admin`, `admin`, `manager`, `cashier` | Toggle item availability |
| PUT | `/api/menu/items/:id/image` | `tenant_admin`, `admin`, `manager` | Upload menu item image |
| GET | `/api/menu/items/:id/recipe` | **Authenticated** (all roles) | Get menu item recipe |
| PUT | `/api/menu/items/:id/recipe` | `tenant_admin`, `admin`, `manager` | Update menu item recipe |

---

### Inventory

#### Ingredient Categories

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/inventory/categories` | `tenant_admin`, `admin`, `manager`, `inventory` | List ingredient categories |
| GET | `/api/inventory/categories/:id` | `tenant_admin`, `admin`, `manager`, `inventory` | Get category by ID |
| POST | `/api/inventory/categories` | `tenant_admin`, `admin`, `manager`, `inventory` | Create category |
| PUT | `/api/inventory/categories/:id` | `tenant_admin`, `admin`, `manager`, `inventory` | Update category |
| DELETE | `/api/inventory/categories/:id` | `tenant_admin`, `admin`, `manager`, `inventory` | Delete category |

#### Ingredients

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/inventory/ingredients` | `tenant_admin`, `admin`, `manager`, `inventory` | List ingredients |
| GET | `/api/inventory/ingredients/:id` | `tenant_admin`, `admin`, `manager`, `inventory` | Get ingredient by ID |
| POST | `/api/inventory/ingredients` | `tenant_admin`, `admin`, `manager`, `inventory` | Create ingredient |
| PUT | `/api/inventory/ingredients/:id` | `tenant_admin`, `admin`, `manager`, `inventory` | Update ingredient |
| DELETE | `/api/inventory/ingredients/:id` | `tenant_admin`, `admin`, `manager`, `inventory` | Delete ingredient |
| PUT | `/api/inventory/ingredients/:id/stock` | `tenant_admin`, `admin`, `manager`, `inventory` | Adjust ingredient stock |

#### Stock Operations

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/inventory/low-stock` | `tenant_admin`, `admin`, `manager`, `inventory` | Get low stock items |
| POST | `/api/inventory/stock-take` | `tenant_admin`, `admin`, `manager`, `inventory` | Perform stock take |
| GET | `/api/inventory/transactions` | `tenant_admin`, `admin`, `manager`, `inventory` | Get inventory transactions |

---

### Recipes

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/recipes/:menuItemId` | **Authenticated** (all roles) | Get recipe for menu item |
| PUT | `/api/recipes/:menuItemId` | `tenant_admin`, `admin`, `manager` | Update recipe |
| DELETE | `/api/recipes/:menuItemId` | `tenant_admin`, `admin`, `manager` | Delete recipe |
| GET | `/api/recipes/:menuItemId/cost` | **Authenticated** (all roles) | Calculate recipe cost |

---

### Orders

#### Order Management

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/orders` | **Authenticated** (all roles) | List orders |
| GET | `/api/orders/:id` | **Authenticated** (all roles) | Get order by ID |
| POST | `/api/orders` | `tenant_admin`, `admin`, `manager`, `waiter`, `server`, `cashier` | Create new order |
| PUT | `/api/orders/:id` | `tenant_admin`, `admin`, `manager`, `waiter`, `cashier` | Update order |
| PUT | `/api/orders/:id/status` | `tenant_admin`, `admin`, `manager`, `waiter`, `cashier` | Update order status |
| DELETE | `/api/orders/:id` | `tenant_admin`, `admin`, `manager` | Cancel order (only admins/managers) |

#### Order Actions

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| POST | `/api/orders/:id/send-to-kitchen` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | Send order to kitchen |
| POST | `/api/orders/:id/split` | `tenant_admin`, `admin`, `manager`, `waiter`, `cashier` | Split order |
| POST | `/api/orders/:id/transfer` | `tenant_admin`, `admin`, `manager`, `waiter` | Transfer order to another table |
| POST | `/api/orders/:id/merge` | `tenant_admin`, `admin`, `manager`, `waiter`, `cashier` | Merge orders |

#### Order Items

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| POST | `/api/orders/:id/items` | `tenant_admin`, `admin`, `manager`, `waiter`, `server`, `cashier` | Add item to order |
| PUT | `/api/orders/:id/items/:itemId` | `tenant_admin`, `admin`, `manager`, `waiter`, `cashier` | Update order item |
| DELETE | `/api/orders/:id/items/:itemId` | `tenant_admin`, `admin`, `manager`, `waiter`, `cashier` | Remove item from order |
| PUT | `/api/orders/:id/items/:itemId/status` | `tenant_admin`, `admin`, `manager`, `cook` | Update item status (kitchen) |

---

### KDS (Kitchen Display System)

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/kds/orders` | `tenant_admin`, `admin`, `manager`, `cook` | Get active orders for KDS |
| GET | `/api/kds/history` | `tenant_admin`, `admin`, `manager`, `cook` | Get KDS history |
| GET | `/api/kds/stats` | `tenant_admin`, `admin`, `manager`, `cook` | Get KDS statistics |
| PUT | `/api/kds/items/:id/status` | `tenant_admin`, `admin`, `manager`, `cook` | Update order item status |
| POST | `/api/kds/orders/:id/bump` | `tenant_admin`, `admin`, `manager`, `cook` | Bump order (mark as served) |

---

### Reports & Analytics

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/reports/sales/daily` | `tenant_admin`, `admin`, `manager` | Daily sales report |
| GET | `/api/reports/sales/hourly` | `tenant_admin`, `admin`, `manager` | Hourly sales report |
| GET | `/api/reports/sales/by-category` | `tenant_admin`, `admin`, `manager` | Sales by category |
| GET | `/api/reports/sales/by-item` | `tenant_admin`, `admin`, `manager` | Top selling items |
| GET | `/api/reports/staff/performance` | `tenant_admin`, `admin`, `manager` | Staff performance report |
| GET | `/api/reports/payments/by-method` | `tenant_admin`, `admin`, `manager` | Payment methods breakdown |
| GET | `/api/reports/inventory/usage` | `tenant_admin`, `admin`, `manager` | Inventory usage report |
| GET | `/api/reports/summary` | `tenant_admin`, `admin`, `manager` | Summary statistics |

---

### Waiter App

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| GET | `/api/waiter/tables` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | Get assigned tables |
| GET | `/api/waiter/orders` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | Get waiter's active orders |
| POST | `/api/waiter/orders` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | Create order from table |
| GET | `/api/waiter/notifications` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | Get notifications |
| PUT | `/api/waiter/notifications/:id/read` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | Mark notification as read |
| PUT | `/api/waiter/notifications/read-all` | `tenant_admin`, `admin`, `manager`, `waiter`, `server` | Mark all notifications as read |

**Note**: Waiter endpoints filter data by `waiterId` from JWT token to ensure waiters only see their own orders and notifications.

---

### File Upload

| Method | Endpoint | Allowed Roles | Description |
|--------|----------|---------------|-------------|
| POST | `/api/upload/image` | `tenant_admin`, `admin`, `manager` | Upload image file |

---

## Role Summary Matrix

### tenant_admin
✅ **Full Access** - Can access all endpoints in the system.

### admin
✅ **Full Restaurant Access** - Can access all restaurant-related endpoints except user management across tenants.

### manager
✅ **Operational Access** - Can access most endpoints except:
- User management
- Tenant-level operations

### waiter / server
✅ **Service Access** - Can access:
- Tables (all operations)
- Orders (create, update, send to kitchen)
- Order items (add, update, remove)
- Waiter-specific endpoints (tables, orders, notifications)
- Menu (read-only)
- Recipes (read-only)

❌ **Cannot access**:
- User management
- Restaurant settings
- Taxes management
- Sections management
- Menu/Category creation/update/delete
- Inventory management
- Reports
- KDS (Kitchen Display System)
- File uploads

### cashier
✅ **Payment Access** - Can access:
- Orders (create, update, update status)
- Order items (add, update, remove)
- Order actions (split, merge)
- Menu items (toggle availability)

❌ **Cannot access**:
- User management
- Restaurant settings
- Tables (create/update/delete)
- Inventory management
- Reports
- KDS
- Waiter endpoints
- File uploads

### cook
✅ **Kitchen Access** - Can access:
- KDS endpoints (all operations)
- Order items (update status)
- Menu (read-only)
- Recipes (read-only)
- Orders (read-only)

❌ **Cannot access**:
- User management
- Restaurant settings
- Tables (create/update/delete)
- Order creation/update
- Inventory management
- Reports
- Waiter endpoints
- File uploads

### inventory
✅ **Inventory Access** - Can access:
- Inventory endpoints (all operations)
- Ingredient categories (all operations)
- Ingredients (all operations)
- Stock operations

❌ **Cannot access**:
- User management
- Restaurant settings
- Tables management
- Menu management
- Orders management
- Reports
- KDS
- Waiter endpoints
- File uploads

---

## Security Notes

### 1. Restaurant ID Isolation
- **CRITICAL**: The `restaurantId` is **never** accepted from client requests (URL params, query strings, or request body).
- It is always extracted from the JWT token (`req.restaurantId`) after authentication.
- This prevents IDOR (Insecure Direct Object Reference) and BAC (Broken Access Control) attacks.
- All database queries automatically filter by `req.restaurantId` to ensure data isolation.

### 2. User ID Isolation
- For waiter endpoints, the `waiterId` is extracted from the JWT token (`req.user.id`).
- Waiters can only see their own orders and notifications.
- This ensures proper data isolation between users.

### 3. Role-Based Access Control (RBAC)
- All protected endpoints use the `authorize` middleware to check user roles.
- Users can only access endpoints allowed for their role.
- Attempts to access unauthorized endpoints return `403 Forbidden`.

### 4. Authentication Requirements
- All protected endpoints require a valid JWT token.
- Tokens expire after a configured period.
- Inactive users cannot authenticate.

### 5. CSRF Protection
- Sensitive GET endpoints that accept filters (like `/api/taxes/list`) use POST instead to mitigate CSRF attacks.
- Always use POST for filtered queries when filters are sent in the request body.

### 6. Data Validation
- All endpoints use Joi validators to validate request data.
- Invalid requests return `400 Bad Request` with detailed error messages.

---

## Endpoint Quick Reference

### Public Endpoints (No Auth)
- `POST /api/auth/login`
- `POST /api/auth/login/pin`
- `GET /api/health`

**Note**: Registration and password reset are managed by administrators only.

### Read-Only Endpoints (All Authenticated Users)
- `GET /api/menu/categories`
- `GET /api/menu/items`
- `GET /api/menu/items/:id/recipe`
- `GET /api/recipes/:menuItemId`
- `GET /api/recipes/:menuItemId/cost`
- `GET /api/orders`
- `GET /api/orders/:id`

### Admin/Manager Only Endpoints
- All `/api/users/*` endpoints
- All `/api/restaurants/*` endpoints
- All `/api/taxes/*` endpoints
- All `/api/features/*` endpoints
- All `/api/sections/*` endpoints
- Menu categories/items create/update/delete
- All `/api/reports/*` endpoints
- All `/api/upload/*` endpoints

### Waiter/Server Endpoints
- All `/api/waiter/*` endpoints
- All `/api/tables/*` endpoints
- Order creation and updates
- Order items management

### Cook Endpoints
- All `/api/kds/*` endpoints
- Order item status updates

### Inventory Endpoints
- All `/api/inventory/*` endpoints

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-XX | 1.0.0 | Initial documentation |

---

## Related Documentation

- `docs/RBAC_IMPLEMENTATION.md` - Complete RBAC implementation guide for frontend and backend

## Notes

- This documentation reflects the current state of the API as of the implementation date.
- Role names are case-sensitive and must match exactly.
- When adding new endpoints, ensure proper role mapping is documented here.
- Always test role-based access control when making changes to endpoints.
- **User Registration and Password Reset**: These are handled by administrators only through `/api/users` endpoints. Regular users cannot self-register or reset passwords.

