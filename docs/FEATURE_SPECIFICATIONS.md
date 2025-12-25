# Feature Specifications

## 🍳 Kitchen Display System (KDS) - Detailed Spec

### Overview
The KDS is a real-time display system for kitchen staff to view and manage incoming orders. It replaces paper tickets and improves kitchen efficiency.

### Access
- **URL**: `https://app.domain.com/kds` or dedicated link in sidebar
- **Enable**: Settings → Features → Kitchen Display System → ON
- **Permissions**: Kitchen role and above

### User Flow
```
1. Order placed (POS/Waiter App)
        ↓
2. Order appears on KDS instantly (Socket.IO)
        ↓
3. Kitchen views orders by station/all
        ↓
4. Staff starts preparing (optional "Start" button)
        ↓
5. Staff marks items complete ("Bump")
        ↓
6. All items done → Order moves to "Ready"
        ↓
7. Expeditor/Waiter picks up
        ↓
8. Order marked as "Served"
```

### UI Components

#### Order Card
```
┌─────────────────────────────────────┐
│ 🟢 #142 | Table 5 | 3:45 ago       │
│ Waiter: John                        │
├─────────────────────────────────────┤
│ 2x Fried Rice                       │
│    - No onion                       │
│    - Extra spicy                    │
│ 1x Chicken Wings                    │
│ 1x Tom Yum Soup                     │
│    - Less spicy                     │
├─────────────────────────────────────┤
│ [BUMP]                              │
└─────────────────────────────────────┘
```

#### Color Coding (Configurable)
| Time | Color | Status |
|------|-------|--------|
| 0-5 min | 🟢 Green | On time |
| 5-10 min | 🟡 Yellow | Attention needed |
| 10+ min | 🔴 Red | Urgent/SLA breach |

### Station Routing
Configure which menu categories go to which station:

```javascript
stationRouting: {
  "Grill": ["Steaks", "Burgers", "BBQ"],
  "Fryer": ["Fried Items", "Appetizers"],
  "Salad": ["Salads", "Cold Appetizers"],
  "Dessert": ["Desserts", "Ice Cream"],
  "Drinks": ["Beverages", "Cocktails"]
}
```

### Settings (KDS Specific)
```
□ Auto-bump when all items done
□ Sound alert for new orders
□ Sound alert for urgent orders (red)
□ Show order notes prominently
□ Show customer allergies warning
□ Dark mode (recommended for kitchen)
□ Font size: [Small | Medium | Large]
□ Alert volume: [────●────] 70%
□ SLA threshold: [10] minutes
```

---

## 📝 Order Management - Detailed Spec

### Mode A: Management Portal (POS)

#### Table Selection View
```
┌──────────────────────────────────────────────┐
│  FLOOR PLAN                    [+ Add Table] │
├──────────────────────────────────────────────┤
│                                              │
│   ┌───┐  ┌───┐  ┌───┐                       │
│   │ 1 │  │ 2 │  │ 3 │   WINDOW SECTION      │
│   │ 🟢│  │ 🔴│  │ 🟢│                       │
│   └───┘  └───┘  └───┘                       │
│                                              │
│   ┌───┐  ┌───┐  ┌─────────┐                 │
│   │ 4 │  │ 5 │  │    6    │  MAIN SECTION   │
│   │ 🟡│  │ 🟢│  │   🔴    │                 │
│   └───┘  └───┘  └─────────┘                 │
│                                              │
│   Legend: 🟢 Available 🟡 Reserved 🔴 Occupied│
└──────────────────────────────────────────────┘
```

#### Order Entry Screen
```
┌────────────────────────────────────────────────────────────┐
│ Table 2 | Guests: 4 | Server: Jane    [Close] [Transfer]  │
├───────────────────────┬────────────────────────────────────┤
│ CATEGORIES            │ ORDER                              │
│ ┌───────────────────┐ │                                    │
│ │ 🍕 Appetizers     │ │ 2x Fried Rice........... $15.98   │
│ │ 🍜 Main Course    │ │    - Extra spicy                  │
│ │ 🥗 Salads         │ │ 1x Tom Yum Soup......... $8.99    │
│ │ 🍰 Desserts       │ │ 3x Thai Iced Tea........ $11.97   │
│ │ 🍺 Beverages      │ │                                    │
│ └───────────────────┘ │ ─────────────────────────────────  │
│                       │ Subtotal:              $36.94      │
│ ITEMS (Main Course)   │ Tax (8%):              $2.96       │
│ ┌─────┐ ┌─────┐      │ ─────────────────────────────────  │
│ │Fried│ │Pad  │      │ TOTAL:                 $39.90      │
│ │Rice │ │Thai │      │                                    │
│ │$7.99│ │$9.99│      │ [Send to Kitchen]                  │
│ └─────┘ └─────┘      │ [Print Bill] [Pay]                 │
└───────────────────────┴────────────────────────────────────┘
```

### Mode B: Waiter App (External Access)

#### Setup
1. Admin enables: Settings → Features → Waiter External Access → ON
2. System generates unique links per table
3. Waiters access via mobile browser (PWA)

#### Table QR/Link Generation
```
Table 1: https://resto.smartresto.com/w/abc123
Table 2: https://resto.smartresto.com/w/def456
...
```

Or waiter-specific:
```
Waiter John: https://resto.smartresto.com/waiter/john-uuid
  → Shows only tables assigned to John
```

#### Waiter App Screens

**1. Table Overview**
```
┌─────────────────────────┐
│ 👋 Hi, John             │
│ Your Tables             │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Table 1      🟢     │ │
│ │ Empty               │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Table 2      🔴     │ │
│ │ 4 guests | $45.00   │ │
│ │ 15 min ago          │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Table 5      🔴     │ │
│ │ 2 guests | $28.50   │ │
│ │ 32 min ago          │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**2. Order Taking**
```
┌─────────────────────────┐
│ ← Table 2               │
├─────────────────────────┤
│ [Appetizers] [Mains]    │
│ [Desserts] [Drinks]     │
├─────────────────────────┤
│ 🍜 Fried Rice    $7.99  │
│    [+] 2 [-]            │
│    □ Extra spicy        │
│    □ No onion           │
│    Notes: _____________ │
├─────────────────────────┤
│ 🍲 Tom Yum      $8.99   │
│    [+] 1 [-]            │
├─────────────────────────┤
│                         │
│ Cart: 3 items | $24.97  │
│ [Review Order →]        │
└─────────────────────────┘
```

**3. Order Review & Send**
```
┌─────────────────────────┐
│ ← Review Order          │
├─────────────────────────┤
│ Table 2 | 4 guests      │
├─────────────────────────┤
│ 2x Fried Rice           │
│   - Extra spicy    Edit │
│                         │
│ 1x Tom Yum Soup    Edit │
├─────────────────────────┤
│ Subtotal:      $24.97   │
│                         │
│ Course Timing:          │
│ (○) Fire all together   │
│ (●) Fire by course      │
│                         │
│ [🔥 Send to Kitchen]    │
└─────────────────────────┘
```

---

## 📦 Auto Stock Deduction - Detailed Spec

### Recipe Builder Interface

```
┌────────────────────────────────────────────────────────────┐
│ RECIPE: Fried Rice                              [Save]     │
├────────────────────────────────────────────────────────────┤
│ Menu Item: Fried Rice ($7.99)                              │
│ Category: Main Course                                       │
│ Yield: 1 serving                                           │
├────────────────────────────────────────────────────────────┤
│ INGREDIENTS                                                 │
│ ┌──────────────────┬──────────┬──────────┬───────────────┐ │
│ │ Ingredient       │ Quantity │ Unit     │ Cost          │ │
│ ├──────────────────┼──────────┼──────────┼───────────────┤ │
│ │ Jasmine Rice     │ 200      │ grams    │ $0.40         │ │
│ │ Cooking Oil      │ 30       │ ml       │ $0.15         │ │
│ │ Salt             │ 5        │ grams    │ $0.01         │ │
│ │ Chicken Breast   │ 100      │ grams    │ $1.20         │ │
│ │ Egg              │ 1        │ unit     │ $0.25         │ │
│ │ Soy Sauce        │ 15       │ ml       │ $0.10         │ │
│ │ Green Onion      │ 20       │ grams    │ $0.08         │ │
│ │ Garlic           │ 10       │ grams    │ $0.05         │ │
│ └──────────────────┴──────────┴──────────┴───────────────┘ │
│                                                             │
│ [+ Add Ingredient]                                          │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│ Total Food Cost: $2.24                                      │
│ Menu Price: $7.99                                           │
│ Food Cost %: 28.0% ✅ (Target: <35%)                        │
│ Gross Profit: $5.75                                         │
└────────────────────────────────────────────────────────────┘
```

### Deduction Flow

```
Order Placed
    │
    ▼
┌─────────────────────────────┐
│ Check Deduction Trigger     │
│ (Configured in Settings)    │
└─────────────────────────────┘
    │
    ├── On Order Placed ──────────► Deduct Immediately
    │
    ├── On Order Confirmed ───────► Deduct when kitchen confirms
    │
    └── On Order Completed ───────► Deduct when served
    
    │
    ▼
┌─────────────────────────────┐
│ For each order item:        │
│ 1. Get recipe               │
│ 2. Multiply by quantity     │
│ 3. Deduct from stock        │
│ 4. Log transaction          │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│ Check Stock Levels          │
│ If below minimum:           │
│ → Create alert              │
│ → Notify inventory manager  │
└─────────────────────────────┘
```

### Stock Deduction Example

**Order: 2x Fried Rice**

```javascript
// Recipe for 1 Fried Rice
recipe = {
  "Jasmine Rice": { qty: 200, unit: "g" },
  "Cooking Oil": { qty: 30, unit: "ml" },
  "Chicken Breast": { qty: 100, unit: "g" },
  // ... etc
}

// Deduction for 2 orders
deduction = {
  "Jasmine Rice": 400g,
  "Cooking Oil": 60ml,
  "Chicken Breast": 200g,
  // ... etc
}

// Transaction Log
{
  id: "txn-12345",
  type: "ORDER_DEDUCTION",
  reference: "order-789",
  items: [
    { ingredient: "Jasmine Rice", qty: -400, unit: "g", 
      stock_before: 5000, stock_after: 4600 },
    // ...
  ],
  timestamp: "2024-12-21T14:30:00Z",
  created_by: "system"
}
```

### Variant Handling

For menu items with variants (e.g., sizes), each variant can have different recipes:

```
Fried Rice (Small) → 150g rice, 75g chicken
Fried Rice (Regular) → 200g rice, 100g chicken  
Fried Rice (Large) → 300g rice, 150g chicken
```

### Modification Handling

Handle order modifications that affect ingredients:

```javascript
modifications = {
  "No onion": { "Green Onion": 0 },      // Remove ingredient
  "Extra chicken": { "Chicken": "+50g" }, // Add more
  "Less spicy": { "Chili": "-50%" }       // Reduce amount
}
```

### Low Stock Alerts

```
┌─────────────────────────────────────────┐
│ ⚠️ LOW STOCK ALERT                      │
├─────────────────────────────────────────┤
│ Chicken Breast                          │
│ Current: 2.5 kg                         │
│ Minimum: 5 kg                           │
│ Estimated Days Left: 1.5                │
│                                         │
│ [Create Purchase Order] [Dismiss]       │
└─────────────────────────────────────────┘
```

---

## ⚙️ Feature Toggle System

### Settings Structure

```javascript
restaurantSettings = {
  // Core Features
  features: {
    kds: {
      enabled: true,
      screens: 2,
      stations: ["Grill", "Fryer", "Prep"],
      slaMinutes: 10,
      darkMode: true,
      soundAlerts: true
    },
    waiterApp: {
      enabled: true,
      allowExternalAccess: true,
      requirePin: true
    },
    inventory: {
      enabled: true,
      autoDeduction: true,
      deductionTrigger: "on_order_confirmed", // on_order_placed, on_order_confirmed, on_completed
      lowStockAlerts: true,
      alertThreshold: 20 // percentage
    },
    reservations: {
      enabled: true,
      maxAdvanceDays: 30,
      requireDeposit: false
    },
    selfOrdering: {
      enabled: false,
      requirePaymentUpfront: false
    },
    loyalty: {
      enabled: false,
      pointsPerDollar: 1,
      rewardThreshold: 100
    },
    delivery: {
      enabled: false,
      zones: [],
      minimumOrder: 20
    }
  },
  
  // Operational Settings
  operations: {
    taxRate: 8.0,
    serviceCharge: 0,
    tipSuggestions: [15, 18, 20, 25],
    currency: "USD",
    timezone: "America/New_York",
    openingHours: { ... }
  },
  
  // UI Settings
  ui: {
    theme: "light",
    primaryColor: "#1976d2",
    logo: "https://...",
    receiptFooter: "Thank you for dining with us!"
  }
}
```

### Feature Check in Code

```typescript
// Backend middleware
const requireFeature = (feature: string) => {
  return async (req, res, next) => {
    const settings = await getRestaurantSettings(req.restaurantId);
    
    if (!settings.features[feature]?.enabled) {
      return res.status(403).json({
        error: "Feature not available",
        message: `${feature} is not enabled for your restaurant`,
        upgrade: getUpgradeInfo(feature)
      });
    }
    
    next();
  };
};

// Usage
router.get('/kds/orders', requireFeature('kds'), kdsController.getOrders);
```

```typescript
// Frontend component
const FeatureGate: React.FC<{ feature: string; children: React.ReactNode }> = ({ 
  feature, 
  children 
}) => {
  const { settings } = useRestaurantSettings();
  
  if (!settings.features[feature]?.enabled) {
    return null; // or upgrade prompt
  }
  
  return <>{children}</>;
};

// Usage
<FeatureGate feature="kds">
  <SidebarItem icon={<KitchenIcon />} label="Kitchen Display" to="/kds" />
</FeatureGate>
```

---

## 🎯 Subscription Tier Feature Matrix

```
Feature                    | Starter | Professional | Enterprise
─────────────────────────────────────────────────────────────────
Basic POS                  |    ✅   |      ✅      |     ✅
Menu Management            |    ✅   |      ✅      |     ✅
Table Management           |    ✅   |      ✅      |     ✅
Basic Reports              |    ✅   |      ✅      |     ✅
Receipt Printing           |    ✅   |      ✅      |     ✅
─────────────────────────────────────────────────────────────────
KDS                        |    ❌   |      ✅      |     ✅
Waiter App                 |    ❌   |      ✅      |     ✅
Auto Stock Deduction       |    ❌   |      ✅      |     ✅
Recipe Management          |    ❌   |      ✅      |     ✅
Reservations               |    ❌   |      ✅      |     ✅
Staff Scheduling           |    ❌   |      ✅      |     ✅
Advanced Reports           |    ❌   |      ✅      |     ✅
─────────────────────────────────────────────────────────────────
Multi-Location             |    ❌   |      ❌      |     ✅
Customer Self-Order        |    ❌   |      ❌      |     ✅
Loyalty Program            |    ❌   |      ❌      |     ✅
Delivery Module            |    ❌   |      ❌      |     ✅
API Access                 |    ❌   |      ❌      |     ✅
Custom Integrations        |    ❌   |      ❌      |     ✅
White-label                |    ❌   |      ❌      |     ✅
```

