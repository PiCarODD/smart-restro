# Smart Restaurant Management System - Project Plan

## 📋 Project Overview

A comprehensive, scalable restaurant management system designed to serve restaurants of all sizes - from small family-owned establishments to large multi-location chains. The system features modular architecture where features can be enabled/disabled based on subscription tier and restaurant needs.

---

## 🏗️ System Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Material-UI (MUI) |
| **Backend** | Node.js + Express.js |
| **Database** | PostgreSQL + Sequelize ORM |
| **Real-time** | Socket.IO |
| **Authentication** | JWT + 2FA (optional) |
| **Mobile** | Progressive Web App (PWA) |
| **Deployment** | Docker + Docker Compose |

### Project Structure

```
smart-restaurant/
├── backend/
│   ├── src/
│   │   ├── config/           # Database, auth, app config
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── models/           # Sequelize models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Helper functions
│   │   ├── sockets/          # Socket.IO handlers
│   │   └── app.js            # Express app setup
│   ├── migrations/           # Database migrations
│   ├── seeders/              # Sample data
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API services
│   │   ├── store/            # State management (Redux/Zustand)
│   │   ├── types/            # TypeScript interfaces
│   │   ├── utils/            # Helper functions
│   │   └── App.tsx           # Main app component
│   └── package.json
├── kds/                      # Kitchen Display System (separate PWA)
│   ├── src/
│   └── package.json
├── waiter-app/               # Waiter Mobile App (PWA)
│   ├── src/
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🎯 Core Modules

### 1. 🍳 Kitchen Display System (KDS)
**Toggle: Settings → Enable KDS**

| Feature | Description |
|---------|-------------|
| Real-time Order Display | Orders appear instantly on kitchen screens |
| Order Priority | Color-coded by wait time (green → yellow → red) |
| Station Routing | Route items to specific stations (grill, fryer, salad) |
| Bump System | Mark items/orders as complete |
| Order Recall | View completed orders history |
| Audio Alerts | Sound notifications for new orders |
| Multi-Screen Support | Different views for different stations |

**KDS Views:**
- All Orders View
- By Station View (Grill, Fry, Prep, etc.)
- Expeditor View (final assembly)

---

### 2. 📝 Order Management System

#### Mode A: Management Portal Orders (Small Restaurants)
- Direct order entry from POS terminal
- Table management with visual floor plan
- Quick order buttons for popular items
- Order modification and cancellation
- Split bill functionality
- Print receipts

#### Mode B: Waiter App Orders (Large Restaurants)
**Toggle: Settings → Enable Waiter External Access**

| Feature | Description |
|---------|-------------|
| QR Code per Table | Each table has unique QR/link |
| Mobile-Optimized UI | Easy ordering on phone |
| Real-time Sync | Instant sync with main system |
| Table Assignment | Waiters assigned to sections |
| Order Notes | Special requests per item |
| Course Timing | Fire courses at right time |
| Guest Count Tracking | Track covers per table |

**External Link Format:**
```
https://yourrestaurant.smartresto.com/order/{table-token}
or
https://yourrestaurant.smartresto.com/waiter/{waiter-id}/table/{table-id}
```

---

### 3. 📦 Inventory & Stock Management

#### Automatic Stock Deduction System

**Recipe/Ingredient Mapping:**
```
Menu Item: Fried Rice
├── Rice: 200g
├── Cooking Oil: 30ml
├── Salt: 5g
├── Chicken: 100g
├── Egg: 1 unit
├── Soy Sauce: 15ml
├── Green Onion: 20g
└── Garlic: 10g
```

| Feature | Description |
|---------|-------------|
| Recipe Builder | Define ingredients per menu item |
| Auto-Deduction | Deduct stock when order is placed/completed |
| Unit Conversion | Support g, kg, ml, L, units, etc. |
| Low Stock Alerts | Notifications when stock is low |
| Stock Forecasting | Predict needs based on sales history |
| Waste Tracking | Log spoilage and waste |
| Supplier Management | Track vendors and costs |
| Purchase Orders | Generate POs automatically |
| Stock Take | Physical inventory counting |
| Cost Calculation | Real-time food cost analysis |

**Deduction Trigger Options (Configurable):**
- On Order Placed
- On Order Confirmed
- On Order Completed

---

### 4. 🍽️ Menu Management

| Feature | Description |
|---------|-------------|
| Categories & Subcategories | Organize menu items |
| Item Variants | Sizes, add-ons, modifications |
| Pricing Tiers | Different prices (dine-in, takeout, delivery) |
| Time-Based Menu | Breakfast, lunch, dinner menus |
| Seasonal Items | Enable/disable items by season |
| Item Availability | Mark items as 86'd (out of stock) |
| Nutritional Info | Calories, allergens, dietary tags |
| Item Photos | Multiple images per item |
| Combo/Deals | Bundle items together |
| Upsell Suggestions | Recommend add-ons |

---

### 5. 🪑 Table & Floor Management

| Feature | Description |
|---------|-------------|
| Visual Floor Plan | Drag-and-drop table layout |
| Multiple Floors/Sections | Support multi-area venues |
| Table Status | Available, Occupied, Reserved, Cleaning |
| Reservation System | Book tables in advance |
| Wait List | Manage walk-in queue |
| Table Merge/Split | Combine or divide tables |
| Capacity Tracking | Monitor seating capacity |
| Turn Time Analysis | Average dining duration |

---

### 6. 👥 Staff Management

| Feature | Description |
|---------|-------------|
| Role-Based Access | Admin, Manager, Cashier, Waiter, Kitchen |
| Shift Scheduling | Create and manage schedules |
| Time Clock | Clock in/out functionality |
| Performance Tracking | Sales per server, order accuracy |
| Tip Management | Track and distribute tips |
| Staff Meals | Track employee meals |
| Training Mode | Practice mode for new staff |

**User Roles:**
| Role | Permissions |
|------|-------------|
| Super Admin | Full system access, subscription management |
| Restaurant Owner | Full restaurant access |
| Manager | Staff, reports, settings (limited) |
| Cashier | POS, payments, basic reports |
| Waiter | Order taking, table management |
| Kitchen | KDS access only |
| Inventory | Stock management only |

---

### 7. 💰 Payment & Billing

| Feature | Description |
|---------|-------------|
| Multiple Payment Methods | Cash, Card, Mobile Wallet |
| Split Payments | Split by item, amount, or equal |
| Tips | Add tip to payment |
| Discounts | Percentage, fixed, item-level |
| Tax Configuration | Multiple tax rates |
| Service Charge | Auto-add service charge |
| Receipt Printing | Thermal printer support |
| Digital Receipts | Email/SMS receipts |
| Daily Settlement | End-of-day reconciliation |
| Refunds | Process refunds with reason |

---

### 8. 📊 Analytics & Reporting

| Report Type | Details |
|-------------|---------|
| Sales Dashboard | Real-time sales, trends, comparisons |
| Item Performance | Best/worst sellers, popularity |
| Revenue Analysis | By category, time, staff |
| Inventory Reports | Stock levels, usage, waste |
| Staff Performance | Sales per server, avg ticket |
| Customer Insights | Visit frequency, preferences |
| Financial Reports | P&L, food cost, labor cost |
| Custom Reports | Build custom report queries |

---

### 9. 🔔 Notifications & Alerts

| Alert Type | Trigger |
|------------|---------|
| Low Stock | Ingredient below threshold |
| Order Ready | Kitchen completes order |
| New Order | Order received (KDS) |
| Reservation | Upcoming reservation reminder |
| SLA Breach | Order exceeding time limit |
| Daily Summary | End-of-day report |
| System Alerts | Errors, downtime, issues |

---

### 10. ⚙️ Settings & Configuration

**Feature Toggles:**
```
□ Enable KDS
□ Enable Waiter External Access
□ Enable Table Reservations
□ Enable Online Ordering
□ Enable Loyalty Program
□ Enable Multi-Language
□ Enable Dark Mode for KDS
□ Enable Auto Stock Deduction
□ Enable Customer Display
□ Enable SMS Notifications
□ Enable 2FA for Staff
□ Enable Tip Suggestions
□ Enable Happy Hour Pricing
□ Enable Kitchen Printer
□ Enable QR Code Ordering (Customer Self-Order)
```

---

## 🌟 Additional Features

### 11. 📱 Customer Self-Ordering (Optional)
**Toggle: Settings → Enable QR Self-Order**

- Customers scan QR at table
- Browse menu on their phone
- Place order directly
- Pay via mobile
- Call waiter button

### 12. 🎁 Loyalty Program (Optional)
**Toggle: Settings → Enable Loyalty**

- Points per purchase
- Rewards catalog
- Member tiers (Bronze, Silver, Gold)
- Birthday rewards
- Referral bonuses

### 13. 🚚 Delivery & Takeout (Optional)
**Toggle: Settings → Enable Delivery/Takeout**

- Online ordering portal
- Delivery zone management
- Driver assignment
- Order tracking
- Delivery fees configuration

### 14. 📞 Customer Relationship Management (CRM)
- Customer database
- Order history
- Preferences and allergies
- Feedback collection
- Marketing campaigns

### 15. 🌐 Multi-Location Support (Enterprise)
- Centralized management
- Per-location settings
- Cross-location reporting
- Inventory transfers
- Shared menu management

---

## 💳 Subscription Plans

### Tier 1: Starter - $49/month
**Best for: Small restaurants, cafes, food trucks**

| Feature | Included |
|---------|----------|
| Users | Up to 3 |
| Orders/month | Unlimited |
| Menu Items | Up to 100 |
| Tables | Up to 15 |
| POS Terminal | 1 |
| **Core Features** | |
| Order Management (Portal) | ✅ |
| Menu Management | ✅ |
| Basic Inventory | ✅ (manual only) |
| Basic Reports | ✅ |
| Receipt Printing | ✅ |
| Payment Processing | ✅ |
| Email Support | ✅ |
| **Not Included** | |
| KDS | ❌ |
| Waiter App | ❌ |
| Auto Stock Deduction | ❌ |
| Table Reservations | ❌ |
| Advanced Analytics | ❌ |
| Multi-location | ❌ |

---

### Tier 2: Professional - $129/month
**Best for: Medium restaurants, multiple staff**

| Feature | Included |
|---------|----------|
| Users | Up to 10 |
| Orders/month | Unlimited |
| Menu Items | Up to 500 |
| Tables | Up to 50 |
| POS Terminals | Up to 3 |
| KDS Screens | Up to 2 |
| **All Starter Features Plus:** | |
| Kitchen Display System (KDS) | ✅ |
| Waiter App (External Access) | ✅ |
| Auto Stock Deduction | ✅ |
| Recipe Management | ✅ |
| Table & Floor Management | ✅ |
| Reservations | ✅ |
| Staff Scheduling | ✅ |
| Advanced Reports | ✅ |
| Customer Database | ✅ |
| Priority Email Support | ✅ |
| **Not Included** | |
| Multi-location | ❌ |
| API Access | ❌ |
| Custom Reports | ❌ |
| White-label | ❌ |

---

### Tier 3: Enterprise - $299/month + $99/location
**Best for: Large restaurants, chains, franchises**

| Feature | Included |
|---------|----------|
| Users | Unlimited |
| Orders/month | Unlimited |
| Menu Items | Unlimited |
| Tables | Unlimited |
| POS Terminals | Unlimited |
| KDS Screens | Unlimited |
| Locations | Unlimited (+$99/location) |
| **All Professional Features Plus:** | |
| Multi-Location Management | ✅ |
| Centralized Dashboard | ✅ |
| Cross-Location Reporting | ✅ |
| Inventory Transfers | ✅ |
| Customer Self-Ordering | ✅ |
| Loyalty Program | ✅ |
| Delivery/Takeout Module | ✅ |
| API Access | ✅ |
| Custom Integrations | ✅ |
| Custom Reports Builder | ✅ |
| Dedicated Account Manager | ✅ |
| 24/7 Phone Support | ✅ |
| On-site Training | ✅ |
| SLA Guarantee (99.9%) | ✅ |
| White-label Option | ✅ (+$199/month) |

---

### Add-Ons (Any Tier)

| Add-On | Price |
|--------|-------|
| Additional POS Terminal | $19/month |
| Additional KDS Screen | $15/month |
| SMS Notifications (1000/month) | $25/month |
| Online Ordering Website | $49/month |
| Advanced Analytics | $39/month |
| Loyalty Program (Starter only) | $29/month |
| Priority Support | $49/month |
| Data Backup & Recovery | $19/month |
| Custom Domain | $9/month |

---

## 📅 Development Phases

### Phase 1: Foundation (Weeks 1-4)
- [ ] Project setup and architecture
- [ ] Database schema design
- [ ] User authentication & authorization
- [ ] Basic API structure
- [ ] Frontend scaffolding

### Phase 2: Core Features (Weeks 5-10)
- [ ] Menu Management
- [ ] Order Management (Portal)
- [ ] Basic Inventory (manual)
- [ ] Table Management
- [ ] Payment & Billing
- [ ] Receipt Printing

### Phase 3: KDS & Waiter App (Weeks 11-14)
- [ ] Kitchen Display System
- [ ] Real-time order updates (Socket.IO)
- [ ] Waiter Mobile App (PWA)
- [ ] External link/QR generation
- [ ] Station routing

### Phase 4: Advanced Inventory (Weeks 15-18)
- [ ] Recipe Builder
- [ ] Auto Stock Deduction
- [ ] Low Stock Alerts
- [ ] Supplier Management
- [ ] Purchase Orders

### Phase 5: Analytics & Reporting (Weeks 19-21)
- [ ] Sales Dashboard
- [ ] Inventory Reports
- [ ] Staff Performance
- [ ] Financial Reports
- [ ] Export functionality

### Phase 6: Additional Features (Weeks 22-26)
- [ ] Reservation System
- [ ] Staff Scheduling
- [ ] Customer Database/CRM
- [ ] Loyalty Program
- [ ] Customer Self-Ordering

### Phase 7: Multi-Location & Polish (Weeks 27-30)
- [ ] Multi-location support
- [ ] Subscription/Billing system
- [ ] Settings & Feature toggles
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

---

## 🗄️ Database Schema Overview

### Core Tables
```
users
├── id, email, password_hash, role
├── restaurant_id (FK)
└── settings (JSON)

restaurants
├── id, name, address, phone
├── subscription_tier
├── settings (JSON - feature toggles)
└── owner_id (FK → users)

menu_categories
├── id, name, description
├── restaurant_id (FK)
└── display_order, is_active

menu_items
├── id, name, description, price
├── category_id (FK)
├── image_url, is_available
└── variants (JSON)

ingredients
├── id, name, unit
├── current_stock, min_stock
├── cost_per_unit
└── restaurant_id (FK)

recipes (menu_item_ingredients)
├── menu_item_id (FK)
├── ingredient_id (FK)
└── quantity, unit

tables
├── id, name/number
├── capacity, section
├── status, position_x, position_y
└── restaurant_id (FK)

orders
├── id, order_number
├── table_id (FK), waiter_id (FK)
├── status, order_type
├── total, tax, discount, tip
├── created_at, completed_at
└── restaurant_id (FK)

order_items
├── id, order_id (FK)
├── menu_item_id (FK)
├── quantity, price
├── modifications (JSON)
├── status, notes
└── station (for KDS routing)

payments
├── id, order_id (FK)
├── amount, method
├── status, reference
└── processed_at

inventory_transactions
├── id, ingredient_id (FK)
├── quantity_change, type
├── reference_id (order_id, etc.)
├── notes
└── created_at, created_by
```

---

## 🔒 Security Considerations

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- API rate limiting
- Input validation and sanitization
- SQL injection prevention (Sequelize ORM)
- XSS protection
- HTTPS everywhere
- Encrypted sensitive data
- Audit logging
- Regular security audits
- PCI compliance for payments

---

## 📱 API Endpoints Overview

### Authentication
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot-password
```

### Menu
```
GET    /api/menu/categories
POST   /api/menu/categories
GET    /api/menu/items
POST   /api/menu/items
PUT    /api/menu/items/:id
DELETE /api/menu/items/:id
```

### Orders
```
GET    /api/orders
POST   /api/orders
GET    /api/orders/:id
PUT    /api/orders/:id
PATCH  /api/orders/:id/status
POST   /api/orders/:id/items
```

### Inventory
```
GET    /api/inventory/ingredients
POST   /api/inventory/ingredients
PUT    /api/inventory/ingredients/:id
GET    /api/inventory/stock-levels
POST   /api/inventory/adjust
GET    /api/inventory/recipes/:menuItemId
POST   /api/inventory/recipes
```

### Tables
```
GET    /api/tables
POST   /api/tables
PUT    /api/tables/:id
PATCH  /api/tables/:id/status
GET    /api/tables/:id/qr-code
```

### Reports
```
GET    /api/reports/sales
GET    /api/reports/inventory
GET    /api/reports/staff-performance
GET    /api/reports/financial
```

### External (Waiter App)
```
GET    /api/external/table/:token
POST   /api/external/orders
GET    /api/external/menu
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (for sessions/caching)
- npm or yarn

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/smart-restaurant.git

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Setup environment variables
cp .env.example .env

# Run database migrations
npm run migrate

# Seed sample data
npm run seed

# Start development servers
npm run dev
```

---

## 📝 Notes

1. **Scalability**: System designed to handle growth from single restaurant to chain
2. **Offline Support**: PWA with offline capabilities for order taking
3. **Localization**: Support for multiple languages and currencies
4. **Integrations**: Ready for third-party integrations (accounting, delivery platforms)
5. **Customization**: Theme customization per restaurant

---

## 📞 Support & Contact

- Documentation: [docs.smartresto.com]
- Support Email: support@smartresto.com
- Emergency Line: 1-800-SMARTRESTO

---

*Last Updated: December 2024*
*Version: 1.0.0*

