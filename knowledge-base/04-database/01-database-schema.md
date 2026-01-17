# Database Schema

## Overview

The Smart Restaurant Management System uses PostgreSQL 15+ with Sequelize ORM. The database is designed for multi-tenant SaaS architecture with restaurant-level data isolation.

## Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   tenants   │────<│ restaurants │────<│    users    │
└─────────────┘     └─────────────┘     └─────────────┘
                          │                    │
                          │                    │
        ┌─────────────────┼────────────────────┤
        │                 │                    │
        ▼                 ▼                    ▼
┌─────────────┐    ┌─────────────┐     ┌─────────────┐
│   tables    │    │menu_categories│   │   orders    │
└─────────────┘    └─────────────┘     └─────────────┘
        │                 │                    │
        │                 ▼                    ▼
        │          ┌─────────────┐     ┌─────────────┐
        │          │ menu_items  │     │ order_items │
        │          └─────────────┘     └─────────────┘
        │                 │                    │
        │                 ▼                    │
        │          ┌─────────────┐            │
        └─────────>│   recipes   │<───────────┘
                   └─────────────┘
                         │
                         ▼
                  ┌─────────────┐     ┌─────────────┐
                  │ ingredients │────>│ inventory_  │
                  └─────────────┘     │ transactions│
                                      └─────────────┘
```

## Core Tables

### Tenants
Multi-tenant SaaS organization level.

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'starter',
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'active',
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Restaurants
Restaurant locations belonging to tenants.

```sql
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    logo_url VARCHAR(500),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Users
Staff members with role-based access.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL,
    pin VARCHAR(4),  -- For quick login
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, email)
);
```

### Sections
Floor sections for table organization.

```sql
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7),  -- Hex color
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tables
Dining tables with position and status.

```sql
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    section_id UUID REFERENCES sections(id),
    name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    position_x INTEGER,
    position_y INTEGER,
    status VARCHAR(50) DEFAULT 'available',
    qr_token VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Menu Categories
Menu organization structure.

```sql
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES menu_categories(id),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Menu Items
Menu items with variants and modifiers.

```sql
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    category_id UUID REFERENCES menu_categories(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    variants JSONB,  -- Size variants, etc.
    modifiers JSONB,  -- Add-ons, modifications
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Ingredients
Inventory ingredients.

```sql
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    category_id UUID REFERENCES ingredient_categories(id),
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,  -- g, kg, ml, L, unit
    current_stock DECIMAL(10,3) DEFAULT 0,
    min_stock DECIMAL(10,3) DEFAULT 0,
    cost_per_unit DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Recipes
Menu item to ingredient mapping.

```sql
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id),
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(menu_item_id, ingredient_id)
);
```

### Orders
Customer orders.

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    table_id UUID REFERENCES tables(id),
    waiter_id UUID REFERENCES users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    order_type VARCHAR(50) DEFAULT 'dine-in',
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    tip DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);
```

### Order Items
Items within an order.

```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    menu_item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    modifications JSONB,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    station VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Payments
Payment transactions.

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    reference VARCHAR(255),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Inventory Transactions
Stock movement history.

```sql
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id),
    quantity_change DECIMAL(10,3) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- purchase, waste, deduction, adjustment
    reference_id UUID,  -- order_id, etc.
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Indexes

### Performance Indexes
```sql
-- Foreign key indexes
CREATE INDEX idx_restaurants_tenant_id ON restaurants(tenant_id);
CREATE INDEX idx_users_restaurant_id ON users(restaurant_id);
CREATE INDEX idx_tables_restaurant_id ON tables(restaurant_id);
CREATE INDEX idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_recipes_menu_item_id ON recipes(menu_item_id);
CREATE INDEX idx_recipes_ingredient_id ON recipes(ingredient_id);
CREATE INDEX idx_inventory_transactions_ingredient_id ON inventory_transactions(ingredient_id);

-- Search indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_menu_items_name ON menu_items(name);
CREATE INDEX idx_ingredients_name ON ingredients(name);
```

## Data Types

### UUID
Primary keys use UUID for:
- Better distribution
- Security (not sequential)
- Multi-database compatibility

### JSONB
Used for flexible schemas:
- `restaurants.settings` - Feature toggles, config
- `menu_items.variants` - Size variants
- `menu_items.modifiers` - Add-ons
- `order_items.modifications` - Item modifications

### DECIMAL
Used for monetary values:
- Prices, totals, costs
- Precision: `DECIMAL(10,2)` for currency
- Stock quantities: `DECIMAL(10,3)` for precision

## Migrations

Migrations are managed via Sequelize CLI:
- Location: `backend/migrations/`
- Naming: `YYYYMMDDHHMMSS-description.js`
- Run: `npm run migrate`

## Seeders

Sample data seeders:
- Location: `backend/seeders/`
- Run: `npm run seed`

## Related Documentation

- [Database Migrations](./02-migrations.md)
- [Model Associations](./03-model-associations.md)
- [Query Optimization](./04-query-optimization.md)


