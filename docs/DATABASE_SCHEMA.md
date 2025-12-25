# Database Schema Specification

## Entity Relationship Diagram (Conceptual)

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
│   tables    │    │menu_categories    │   orders    │
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

---

## Tables Definition

### 1. Tenants (Multi-tenant SaaS)

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,  -- for subdomain: slug.smartresto.com
    
    -- Subscription
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'starter', -- starter, professional, enterprise
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, past_due, cancelled
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    
    -- Limits based on tier
    max_restaurants INT DEFAULT 1,
    max_users INT DEFAULT 3,
    max_menu_items INT DEFAULT 100,
    
    -- Contact
    owner_email VARCHAR(255) NOT NULL,
    billing_email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_stripe_customer ON tenants(stripe_customer_id);
```

### 2. Restaurants

```sql
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL, -- unique within tenant
    description TEXT,
    
    -- Contact & Location
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Settings (JSON for flexibility)
    settings JSONB DEFAULT '{
        "features": {
            "kds": { "enabled": false },
            "waiterApp": { "enabled": false },
            "inventory": { "enabled": true, "autoDeduction": false },
            "reservations": { "enabled": false },
            "selfOrdering": { "enabled": false },
            "loyalty": { "enabled": false }
        },
        "operations": {
            "taxRate": 8.0,
            "serviceCharge": 0,
            "currency": "USD",
            "timezone": "America/New_York"
        },
        "ui": {
            "theme": "light",
            "primaryColor": "#1976d2"
        }
    }'::jsonb,
    
    -- Media
    logo_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_restaurants_tenant ON restaurants(tenant_id);
CREATE INDEX idx_restaurants_settings ON restaurants USING GIN(settings);
```

### 3. Users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL, -- NULL = access to all restaurants in tenant
    
    -- Authentication
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    
    -- Role & Permissions
    role VARCHAR(50) NOT NULL DEFAULT 'waiter',
    -- Roles: super_admin, tenant_admin, restaurant_owner, manager, cashier, waiter, kitchen, inventory
    
    -- Waiter-specific
    pin_code VARCHAR(10), -- Quick login for waiter app
    assigned_sections TEXT[], -- Array of section names
    
    -- 2FA
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_restaurant ON users(restaurant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 4. Tables (Restaurant Floor)

```sql
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Identity
    table_number VARCHAR(20) NOT NULL,
    name VARCHAR(100), -- Optional friendly name like "Window Booth"
    
    -- Physical
    section VARCHAR(100), -- "Main Floor", "Patio", "Private Room"
    floor INT DEFAULT 1,
    capacity INT NOT NULL DEFAULT 4,
    shape VARCHAR(20) DEFAULT 'square', -- square, round, rectangle
    
    -- Position (for floor plan)
    position_x INT DEFAULT 0,
    position_y INT DEFAULT 0,
    width INT DEFAULT 100,
    height INT DEFAULT 100,
    rotation INT DEFAULT 0,
    
    -- Status
    status VARCHAR(50) DEFAULT 'available', -- available, occupied, reserved, cleaning, blocked
    
    -- External Access
    external_token VARCHAR(100) UNIQUE, -- For waiter app / QR code access
    qr_code_url VARCHAR(500),
    
    -- Current Order (denormalized for quick lookup)
    current_order_id UUID,
    occupied_at TIMESTAMP WITH TIME ZONE,
    guest_count INT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(restaurant_id, table_number)
);

CREATE INDEX idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_external_token ON tables(external_token);
```

### 5. Menu Categories

```sql
CREATE TABLE menu_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL, -- For subcategories
    
    -- Content
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    
    -- Display
    display_order INT DEFAULT 0,
    color VARCHAR(20), -- For UI accent
    icon VARCHAR(50), -- Icon name/code
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    available_start_time TIME, -- e.g., breakfast 6:00-11:00
    available_end_time TIME,
    available_days INT[], -- 0=Sun, 1=Mon, ... 6=Sat. NULL = all days
    
    -- KDS Routing
    kds_station VARCHAR(100), -- Which kitchen station
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_menu_categories_restaurant ON menu_categories(restaurant_id);
CREATE INDEX idx_menu_categories_parent ON menu_categories(parent_id);
```

### 6. Menu Items

```sql
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    
    -- Content
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    
    -- Pricing
    base_price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2), -- For profit calculation (auto-calculated from recipe)
    
    -- Variants (JSON for flexibility)
    -- e.g., [{"name": "Small", "price": 5.99}, {"name": "Large", "price": 8.99}]
    variants JSONB DEFAULT '[]'::jsonb,
    
    -- Modifiers/Add-ons
    -- e.g., [{"name": "Extra Cheese", "price": 1.50}, {"name": "No Onion", "price": 0}]
    modifiers JSONB DEFAULT '[]'::jsonb,
    
    -- Media
    image_url VARCHAR(500),
    images JSONB DEFAULT '[]'::jsonb, -- Multiple images
    
    -- Dietary & Nutritional
    calories INT,
    allergens TEXT[], -- e.g., ['gluten', 'dairy', 'nuts']
    dietary_tags TEXT[], -- e.g., ['vegetarian', 'vegan', 'halal', 'gluten-free']
    
    -- Display
    display_order INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    is_available BOOLEAN DEFAULT true, -- Can be marked "86'd" (out of stock)
    available_start_time TIME,
    available_end_time TIME,
    available_days INT[],
    
    -- Preparation
    prep_time_minutes INT, -- Estimated prep time
    kds_station VARCHAR(100), -- Override category station
    
    -- Stock
    track_inventory BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_active ON menu_items(is_active, is_available);
```

### 7. Ingredients

```sql
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Identity
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100), -- Stock Keeping Unit
    barcode VARCHAR(100),
    
    -- Categorization
    category VARCHAR(100), -- "Proteins", "Vegetables", "Spices", "Dairy", etc.
    
    -- Units
    unit VARCHAR(50) NOT NULL, -- g, kg, ml, L, unit, oz, lb, etc.
    unit_cost DECIMAL(10, 4) NOT NULL DEFAULT 0, -- Cost per unit
    
    -- Stock Levels
    current_stock DECIMAL(12, 3) DEFAULT 0,
    minimum_stock DECIMAL(12, 3) DEFAULT 0, -- Alert threshold
    maximum_stock DECIMAL(12, 3), -- Reorder up to
    reorder_quantity DECIMAL(12, 3), -- Default order quantity
    
    -- Supplier
    preferred_supplier_id UUID, -- FK to suppliers table if exists
    supplier_name VARCHAR(255),
    supplier_sku VARCHAR(100),
    
    -- Storage
    storage_location VARCHAR(100), -- "Walk-in Cooler", "Dry Storage", etc.
    storage_temp VARCHAR(50), -- "Refrigerated", "Frozen", "Room Temp"
    
    -- Expiry
    shelf_life_days INT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(restaurant_id, name)
);

CREATE INDEX idx_ingredients_restaurant ON ingredients(restaurant_id);
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_low_stock ON ingredients(restaurant_id, current_stock, minimum_stock);
```

### 8. Recipes (Menu Item ↔ Ingredient Mapping)

```sql
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    
    -- For variants: NULL means base recipe, otherwise specific variant
    variant_name VARCHAR(100), -- e.g., "Small", "Large"
    
    -- Quantity
    quantity DECIMAL(10, 3) NOT NULL,
    unit VARCHAR(50) NOT NULL, -- Should match ingredient unit for deduction
    
    -- Optional: preparation waste factor
    -- e.g., 1.1 means 10% extra needed due to prep waste
    waste_factor DECIMAL(5, 2) DEFAULT 1.0,
    
    -- Notes
    notes TEXT, -- e.g., "Diced", "Pre-cooked"
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(menu_item_id, ingredient_id, variant_name)
);

CREATE INDEX idx_recipes_menu_item ON recipes(menu_item_id);
CREATE INDEX idx_recipes_ingredient ON recipes(ingredient_id);
```

### 9. Orders

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Order Identity
    order_number VARCHAR(50) NOT NULL, -- Human-readable: #142
    order_type VARCHAR(50) NOT NULL DEFAULT 'dine_in', -- dine_in, takeout, delivery
    
    -- Table & Staff
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    waiter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Customer (for takeout/delivery or loyalty)
    customer_id UUID, -- FK to customers table if exists
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    guest_count INT DEFAULT 1,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- pending, confirmed, preparing, ready, served, completed, cancelled
    
    -- Timing
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    ready_at TIMESTAMP WITH TIME ZONE,
    served_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Pricing
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    discount_reason VARCHAR(255),
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    service_charge DECIMAL(10, 2) DEFAULT 0,
    tip_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    
    -- Payment
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, partial, paid, refunded
    
    -- Notes
    notes TEXT,
    kitchen_notes TEXT,
    
    -- Source
    source VARCHAR(50) DEFAULT 'pos', -- pos, waiter_app, self_order, online
    
    -- Stock Deduction
    stock_deducted BOOLEAN DEFAULT false,
    stock_deducted_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(restaurant_id, order_number)
);

CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_waiter ON orders(waiter_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_placed_at ON orders(placed_at);
CREATE INDEX idx_orders_date ON orders(restaurant_id, DATE(placed_at));
```

### 10. Order Items

```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    
    -- Item Details (denormalized for historical accuracy)
    item_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(100), -- If a variant was selected
    
    -- Quantity & Price
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    
    -- Modifiers Applied
    modifiers JSONB DEFAULT '[]'::jsonb,
    -- e.g., [{"name": "Extra Cheese", "price": 1.50}, {"name": "No Onion", "price": 0}]
    modifiers_total DECIMAL(10, 2) DEFAULT 0,
    
    -- Special Instructions
    notes TEXT, -- Customer special requests
    
    -- Kitchen Status
    status VARCHAR(50) DEFAULT 'pending',
    -- pending, preparing, ready, served, cancelled
    
    -- KDS Routing
    kds_station VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE,
    ready_at TIMESTAMP WITH TIME ZONE,
    
    -- Course (for multi-course meals)
    course INT DEFAULT 1, -- 1=appetizer, 2=main, 3=dessert
    fire_at TIMESTAMP WITH TIME ZONE, -- When to start preparing
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);
CREATE INDEX idx_order_items_status ON order_items(status);
CREATE INDEX idx_order_items_station ON order_items(kds_station, status);
```

### 11. Payments

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Amount
    amount DECIMAL(10, 2) NOT NULL,
    tip_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Method
    payment_method VARCHAR(50) NOT NULL, -- cash, card, mobile_wallet, gift_card
    
    -- Card Details (if applicable)
    card_type VARCHAR(50), -- visa, mastercard, amex
    card_last_four VARCHAR(4),
    
    -- External Reference
    transaction_id VARCHAR(255), -- From payment processor
    processor VARCHAR(50), -- stripe, square, etc.
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- pending, completed, failed, refunded, partially_refunded
    
    -- Refund
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    refund_reason TEXT,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    -- Staff
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
```

### 12. Inventory Transactions

```sql
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    
    -- Transaction Type
    transaction_type VARCHAR(50) NOT NULL,
    -- order_deduction, manual_adjustment, stock_take, purchase, waste, transfer_in, transfer_out
    
    -- Quantity Change
    quantity_change DECIMAL(12, 3) NOT NULL, -- Negative for deductions
    unit VARCHAR(50) NOT NULL,
    
    -- Stock Levels
    stock_before DECIMAL(12, 3) NOT NULL,
    stock_after DECIMAL(12, 3) NOT NULL,
    
    -- Reference
    reference_type VARCHAR(50), -- order, purchase_order, stock_take, etc.
    reference_id UUID,
    
    -- Details
    notes TEXT,
    cost_per_unit DECIMAL(10, 4), -- For purchase transactions
    total_cost DECIMAL(10, 2),
    
    -- Performed By
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_trans_restaurant ON inventory_transactions(restaurant_id);
CREATE INDEX idx_inventory_trans_ingredient ON inventory_transactions(ingredient_id);
CREATE INDEX idx_inventory_trans_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_trans_reference ON inventory_transactions(reference_type, reference_id);
CREATE INDEX idx_inventory_trans_created ON inventory_transactions(created_at);
```

### 13. Reservations

```sql
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
    
    -- Customer
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    
    -- Reservation Details
    guest_count INT NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    duration_minutes INT DEFAULT 90,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    -- pending, confirmed, seated, completed, no_show, cancelled
    
    -- Notes
    special_requests TEXT,
    internal_notes TEXT,
    
    -- Confirmation
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmation_code VARCHAR(20),
    
    -- Reminder
    reminder_sent BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reservations_restaurant ON reservations(restaurant_id);
CREATE INDEX idx_reservations_date ON reservations(restaurant_id, reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
```

### 14. Audit Log

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action
    action VARCHAR(100) NOT NULL, -- e.g., "order.created", "payment.refund", "settings.updated"
    entity_type VARCHAR(100), -- e.g., "order", "payment", "menu_item"
    entity_id UUID,
    
    -- Details
    changes JSONB, -- { before: {...}, after: {...} }
    metadata JSONB, -- Additional context
    
    -- Request Info
    ip_address VARCHAR(50),
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_restaurant ON audit_logs(restaurant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

---

## Sequelize Models Reference

### Example: Menu Item Model

```javascript
// backend/src/models/MenuItem.js
module.exports = (sequelize, DataTypes) => {
  const MenuItem = sequelize.define('MenuItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'restaurant_id'
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'category_id'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: DataTypes.TEXT,
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'base_price'
    },
    costPrice: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'cost_price'
    },
    variants: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    modifiers: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      field: 'image_url'
    },
    allergens: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: []
    },
    dietaryTags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      field: 'dietary_tags'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_available'
    },
    trackInventory: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'track_inventory'
    },
    kdsStation: {
      type: DataTypes.STRING(100),
      field: 'kds_station'
    }
  }, {
    tableName: 'menu_items',
    underscored: true,
    timestamps: true
  });

  MenuItem.associate = (models) => {
    MenuItem.belongsTo(models.Restaurant, {
      foreignKey: 'restaurantId'
    });
    MenuItem.belongsTo(models.MenuCategory, {
      foreignKey: 'categoryId',
      as: 'category'
    });
    MenuItem.hasMany(models.Recipe, {
      foreignKey: 'menuItemId',
      as: 'recipes'
    });
    MenuItem.hasMany(models.OrderItem, {
      foreignKey: 'menuItemId'
    });
  };

  return MenuItem;
};
```

---

## Database Migrations Order

1. `001_create_tenants.js`
2. `002_create_restaurants.js`
3. `003_create_users.js`
4. `004_create_tables.js`
5. `005_create_menu_categories.js`
6. `006_create_menu_items.js`
7. `007_create_ingredients.js`
8. `008_create_recipes.js`
9. `009_create_orders.js`
10. `010_create_order_items.js`
11. `011_create_payments.js`
12. `012_create_inventory_transactions.js`
13. `013_create_reservations.js`
14. `014_create_audit_logs.js`

