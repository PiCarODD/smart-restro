# Order Creation Flow Documentation

This document explains the complete order creation flow in the Smart Restaurant application, from user interaction to database persistence.

## Overview

The order creation flow supports multiple entry points:
1. **POS System** (`/pos/:tableId`) - Main point of sale for staff
2. **Waiter App** (`/waiter/pos`) - Mobile app for waiters
3. **Direct API** - For integrations

## Architecture Flow

```
Frontend (React/TypeScript)
    ↓
Zustand Store (orderStore.ts)
    ↓
API Client (ordersApi.ts)
    ↓
Backend Routes (routes/orders.js)
    ↓
Controller (controllers/orderController.js)
    ↓
Service Layer (services/orderService.js)
    ↓
Database (PostgreSQL via Sequelize)
```

---

## 1. Frontend Flow

### 1.1 POS Page Entry Point

**File:** `frontend/src/pages/orders/POSPage.tsx`

**Initial Setup:**
1. User navigates to `/pos/:tableId`
2. Component checks for existing active order for the table
3. If no order exists, shows guest count dialog
4. User enters guest count and clicks "Start Order"

**Key State:**
- `pendingOrderInfo`: Stores order metadata before creation (tableId, guestCount, waiterId)
- `currentOrder`: The active order being built
- Order is NOT created immediately - waits for first item

### 1.2 Adding Items to Order

**Two Methods:**

#### Method A: Direct Add (Simple Items)
```typescript
// User clicks menu item → directly added
const addItemDirectly = async (item: MenuItem) => {
  const itemData = {
    menuItemId: item.id,
    name: item.name,
    quantity: 1,
    unitPrice: item.basePrice,
    totalPrice: item.basePrice,
    modifiers: []
  };
  
  // Create order if needed (first item)
  const order = await createOrderIfNeeded(itemData);
  
  // Add item to existing order
  if (!hadPendingInfo) {
    await addItemToOrder(order.id, itemData);
  }
};
```

#### Method B: Add with Modifiers (Complex Items)
```typescript
// User clicks item → modifier dialog opens
// User selects modifiers → adds to order
const handleAddWithModifiers = async (item, variant, modifiers, notes) => {
  const itemData = {
    menuItemId: item.id,
    name: item.name,
    quantity: itemQuantity,
    unitPrice: totalUnitPrice, // base + modifiers
    totalPrice: totalUnitPrice * itemQuantity,
    variant: variant?.name,
    modifiers: modifiers.map(m => m.name),
    notes: notes
  };
  
  const order = await createOrderIfNeeded(itemData);
  await addItemToOrder(order.id, itemData);
};
```

### 1.3 Order Creation Helper

**File:** `frontend/src/pages/orders/POSPage.tsx` (lines 100-150)

```typescript
const createOrderIfNeeded = async (firstItem) => {
  // If order already exists, return it
  if (currentOrder) return currentOrder;
  
  // If pending info exists, create order with first item
  if (pendingOrderInfo) {
    const order = await createOrder(
      pendingOrderInfo.tableId,
      pendingOrderInfo.tableName,
      pendingOrderInfo.guestCount,
      pendingOrderInfo.waiterId,
      pendingOrderInfo.waiterName
    );
    
    // Add first item to the newly created order
    await addItemToOrder(order.id, firstItem);
    setPendingOrderInfo(null);
    return order;
  }
  
  // Otherwise, create empty order
  const order = await createOrder(tableId, tableName, guestCount);
  await addItemToOrder(order.id, firstItem);
  return order;
};
```

---

## 2. Zustand Store Layer

**File:** `frontend/src/store/orderStore.ts`

### 2.1 Create Order Function

```typescript
createOrder: async (tableId, tableName, guestCount, waiterId, waiterName) => {
  const user = useAuthStore.getState().user;
  
  const response = await ordersApi.create({
    orderType: 'dine_in',
    tableId,
    waiterId: waiterId || user?.id,
    guestCount,
    source: 'pos',
    items: [] // Empty initially
  });
  
  const order = mapApiOrderToOrder(response.order);
  order.tableName = tableName;
  if (waiterName) order.waiterName = waiterName;
  
  // Update store
  set(state => ({
    orders: [...state.orders, order],
    currentOrder: order
  }));
  
  return order;
}
```

### 2.2 Add Item to Order

```typescript
addItemToOrder: async (orderId, item) => {
  // Map frontend format to API format
  const apiItem = {
    menuItemId: item.menuItemId,
    variantName: item.variant,
    quantity: item.quantity,
    modifiers: item.modifiers?.map(name => ({ name, price: 0 })),
    notes: item.notes
  };
  
  await ordersApi.addItem(orderId, apiItem);
  
  // Reload order to get updated totals
  const orderResponse = await ordersApi.getById(orderId);
  const updatedOrder = mapApiOrderToOrder(orderResponse.order);
  
  // Update store
  set(state => ({
    orders: state.orders.map(order =>
      order.id === orderId ? updatedOrder : order
    ),
    currentOrder: state.currentOrder?.id === orderId 
      ? updatedOrder 
      : state.currentOrder
  }));
}
```

---

## 3. API Client Layer

**File:** `frontend/src/lib/api/ordersApi.ts`

### 3.1 Create Order API Call

```typescript
create: async (data: CreateOrderRequest) => {
  const response = await apiClient.post<{ order: Order }>('/orders', data);
  return response.data;
}
```

**Request Format:**
```typescript
{
  orderType: 'dine_in' | 'takeout' | 'delivery',
  tableId?: string,
  waiterId?: string,
  guestCount?: number,
  source: 'pos' | 'waiter_app' | 'self_order' | 'online',
  items: Array<{
    menuItemId: string,
    variantName?: string,
    quantity: number,
    modifiers?: Array<{ name: string; price: number }>,
    notes?: string,
    kdsStation?: string,
    course?: number
  }>
}
```

### 3.2 Add Item API Call

```typescript
addItem: async (orderId: string, item) => {
  const response = await apiClient.post<{ orderItem: OrderItem }>(
    `/orders/${orderId}/items`, 
    item
  );
  return response.data;
}
```

---

## 4. Backend Routes

**File:** `backend/src/routes/orders.js`

```javascript
// Create order
router.post('/', 
  authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server', 'cashier'),
  orderValidator.validateCreate,
  orderController.create
);

// Add item to order
router.post('/:id/items',
  authMiddleware.authorize('tenant_admin', 'admin', 'manager', 'waiter', 'server', 'cashier'),
  orderItemController.addItem
);
```

**Authorization:** Requires authenticated user with appropriate role
**Validation:** `orderValidator.validateCreate` checks required fields

---

## 5. Backend Controller

**File:** `backend/src/controllers/orderController.js`

### 5.1 Create Order Controller

```javascript
async create(req, res, next) {
  try {
    // Call service to create order
    const order = await orderService.createOrder(
      req.body,        // Order data
      req.user.id,     // User ID (from JWT)
      req.restaurantId // Restaurant ID (from auth middleware)
    );

    // Update table status if table is assigned
    if (order.tableId) {
      await Table.update(
        { 
          currentOrderId: order.id, 
          status: 'occupied', 
          occupiedAt: new Date() 
        },
        { where: { id: order.tableId } }
      );
    }

    // Emit real-time event via Socket.IO
    if (req.app.get('io')) {
      req.app.get('io')
        .to(`restaurant:${req.restaurantId}`)
        .emit('order:created', order);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    next(error);
  }
}
```

**Key Actions:**
1. Creates order via service layer
2. Updates table status to 'occupied'
3. Emits Socket.IO event for real-time updates
4. Returns created order with all relationships

---

## 6. Service Layer

**File:** `backend/src/services/orderService.js`

### 6.1 Create Order Service

```javascript
async createOrder(orderData, userId, restaurantId) {
  const dbTransaction = await sequelize.transaction();

  try {
    // 1. Generate unique order number
    const orderNumber = await this.generateOrderNumber(restaurantId);
    // Format: REST-YYYYMMDD-001 (e.g., REST-20241226-001)

    // 2. Create order record
    const order = await Order.create({
      restaurantId,
      orderNumber,
      orderType: orderData.orderType || 'dine_in',
      tableId: orderData.tableId,
      waiterId: orderData.waiterId || userId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail,
      guestCount: orderData.guestCount || 1,
      status: 'pending', // Initial status
      source: orderData.source || 'pos',
      notes: orderData.notes,
      kitchenNotes: orderData.kitchenNotes
    }, { transaction: dbTransaction });

    // 3. Create order items (if provided)
    if (orderData.items && orderData.items.length > 0) {
      for (const itemData of orderData.items) {
        // Fetch menu item to get pricing
        const menuItem = await MenuItem.findByPk(itemData.menuItemId);
        if (!menuItem) continue;

        // Calculate variant price
        const variant = itemData.variantName 
          ? menuItem.variants?.find(v => v.name === itemData.variantName)
          : null;
        const unitPrice = variant 
          ? parseFloat(variant.price) 
          : parseFloat(menuItem.basePrice);

        // Calculate modifiers total
        let modifiersTotal = 0;
        if (itemData.modifiers && Array.isArray(itemData.modifiers)) {
          modifiersTotal = itemData.modifiers.reduce(
            (sum, mod) => sum + parseFloat(mod.price || 0), 
            0
          );
        }

        // Calculate total price
        const totalPrice = (unitPrice * itemData.quantity) + modifiersTotal;

        // Create order item
        await OrderItem.create({
          orderId: order.id,
          menuItemId: itemData.menuItemId,
          itemName: menuItem.name,
          variantName: itemData.variantName || null,
          quantity: itemData.quantity,
          unitPrice,
          totalPrice,
          modifiers: itemData.modifiers || [],
          modifiersTotal,
          notes: itemData.notes,
          kdsStation: itemData.kdsStation || menuItem.kdsStation,
          course: itemData.course || 1,
          fireAt: itemData.fireAt || null,
          status: 'pending'
        }, { transaction: dbTransaction });
      }
    }

    // 4. Calculate order totals (subtotal, tax, total)
    await this.calculateOrderTotals(order.id);

    // 5. Commit transaction
    await dbTransaction.commit();

    // 6. Return order with relationships
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'orderItems' },
        { model: Table, as: 'table' },
        { model: User, as: 'waiter', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    return createdOrder;
  } catch (error) {
    await dbTransaction.rollback();
    throw error;
  }
}
```

**Key Features:**
- **Transaction-based:** All operations in a single database transaction
- **Order Number Generation:** Unique per restaurant per day
- **Price Calculation:** Handles variants and modifiers
- **Total Calculation:** Calls `calculateOrderTotals()` to compute subtotal, tax, total
- **Relationships:** Returns order with items, table, and waiter data

### 6.2 Order Number Generation

```javascript
async generateOrderNumber(restaurantId) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  // Format: YYYYMMDD (e.g., 20241226)

  // Find last order number for today
  const lastOrder = await Order.findOne({
    where: {
      restaurantId,
      orderNumber: {
        [Op.like]: `REST-${dateStr}-%`
      }
    },
    order: [['orderNumber', 'DESC']]
  });

  let sequence = 1;
  if (lastOrder) {
    const lastSeq = parseInt(lastOrder.orderNumber.split('-')[2]);
    sequence = lastSeq + 1;
  }

  return `REST-${dateStr}-${String(sequence).padStart(3, '0')}`;
  // Example: REST-20241226-001
}
```

### 6.3 Calculate Order Totals

```javascript
async calculateOrderTotals(orderId) {
  const order = await Order.findByPk(orderId, {
    include: [{ model: OrderItem, as: 'orderItems' }]
  });

  // Calculate subtotal from items
  const subtotal = order.orderItems.reduce(
    (sum, item) => sum + parseFloat(item.totalPrice), 
    0
  );

  // Get tax configuration from restaurant settings
  const restaurant = await Restaurant.findByPk(order.restaurantId);
  const taxRate = restaurant.settings?.taxRate || 0;
  const taxAmount = subtotal * (taxRate / 100);

  // Calculate total
  const totalAmount = subtotal + taxAmount - order.discountAmount;

  // Update order
  await order.update({
    subtotal,
    taxAmount,
    totalAmount
  });
}
```

---

## 7. Order Item Controller

**File:** `backend/src/controllers/orderItemController.js`

### 7.1 Add Item to Order

```javascript
async addItem(req, res, next) {
  try {
    const { id: orderId } = req.params;
    const itemData = req.body;

    // Verify order exists and belongs to restaurant
    const order = await Order.findOne({
      where: { id: orderId, restaurantId: req.restaurantId }
    });

    if (!order) {
      throw new NotFoundError('Order');
    }

    // Check order status
    if (['completed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        error: 'Cannot add items to completed or cancelled order'
      });
    }

    // Fetch menu item
    const menuItem = await MenuItem.findByPk(itemData.menuItemId);
    if (!menuItem) {
      throw new NotFoundError('Menu item');
    }

    // Calculate pricing
    const variant = itemData.variantName 
      ? menuItem.variants?.find(v => v.name === itemData.variantName)
      : null;
    const unitPrice = variant 
      ? parseFloat(variant.price) 
      : parseFloat(menuItem.basePrice);

    // Calculate modifiers
    let modifiersTotal = 0;
    if (itemData.modifiers && Array.isArray(itemData.modifiers)) {
      modifiersTotal = itemData.modifiers.reduce(
        (sum, mod) => sum + parseFloat(mod.price || 0), 
        0
      );
    }

    const totalPrice = (unitPrice * itemData.quantity) + modifiersTotal;

    // Create order item
    const orderItem = await OrderItem.create({
      orderId: order.id,
      menuItemId: itemData.menuItemId,
      itemName: menuItem.name,
      variantName: itemData.variantName || null,
      quantity: itemData.quantity,
      unitPrice,
      totalPrice,
      modifiers: itemData.modifiers || [],
      modifiersTotal,
      notes: itemData.notes,
      kdsStation: itemData.kdsStation || menuItem.kdsStation,
      course: itemData.course || 1,
      status: 'pending'
    });

    // Recalculate order totals
    await orderService.calculateOrderTotals(order.id);

    // Reload order with items
    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'orderItems' },
        { model: Table, as: 'table' },
        { model: User, as: 'waiter' }
      ]
    });

    res.status(201).json({
      message: 'Item added successfully',
      orderItem,
      order: updatedOrder
    });
  } catch (error) {
    next(error);
  }
}
```

---

## 8. Database Models

### 8.1 Order Model

**File:** `backend/src/models/Order.js`

**Key Fields:**
- `id`: UUID (primary key)
- `restaurantId`: UUID (foreign key)
- `orderNumber`: String (unique identifier, e.g., "REST-20241226-001")
- `status`: Enum ('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled')
- `orderType`: Enum ('dine_in', 'takeout', 'delivery')
- `tableId`: UUID (optional, for dine-in)
- `waiterId`: UUID (optional)
- `guestCount`: Integer
- `subtotal`, `taxAmount`, `totalAmount`: Decimal
- `source`: Enum ('pos', 'waiter_app', 'self_order', 'online')
- Timestamps: `placedAt`, `confirmedAt`, `readyAt`, `servedAt`, `completedAt`

**Relationships:**
- `belongsTo` Restaurant
- `belongsTo` Table
- `belongsTo` User (waiter)
- `hasMany` OrderItem
- `hasMany` Payment

### 8.2 OrderItem Model

**File:** `backend/src/models/OrderItem.js`

**Key Fields:**
- `id`: UUID (primary key)
- `orderId`: UUID (foreign key)
- `menuItemId`: UUID (foreign key)
- `itemName`: String (snapshot of menu item name)
- `variantName`: String (optional)
- `quantity`: Integer
- `unitPrice`: Decimal
- `totalPrice`: Decimal (unitPrice * quantity + modifiers)
- `modifiers`: JSONB (array of modifier objects)
- `modifiersTotal`: Decimal
- `notes`: Text
- `status`: Enum ('pending', 'preparing', 'ready', 'served', 'cancelled')
- `kdsStation`: String (kitchen display station)
- `course`: Integer (for course-based service)

**Relationships:**
- `belongsTo` Order
- `belongsTo` MenuItem

---

## 9. Order Status Flow

```
pending → confirmed → preparing → ready → served → completed
   ↓
cancelled (can happen at any stage before completed)
```

**Status Transitions:**
1. **pending**: Order created, items being added
2. **confirmed**: Order sent to kitchen (via "Send to Kitchen" button)
3. **preparing**: Kitchen started preparing (KDS)
4. **ready**: Items ready for pickup
5. **served**: Items delivered to table
6. **completed**: Order finished, payment processed
7. **cancelled**: Order cancelled (can happen before completion)

---

## 10. Real-time Updates (Socket.IO)

When an order is created or updated:

1. **Backend emits event:**
   ```javascript
   req.app.get('io')
     .to(`restaurant:${restaurantId}`)
     .emit('order:created', order);
   ```

2. **Frontend subscribes:**
   ```typescript
   // In orderStore.ts
   subscribeToOrders({
     'order:created': () => {
       debouncedLoadOrders(500); // Reload orders
     }
   });
   ```

3. **All connected clients** (KDS, POS, Waiter App) receive updates automatically

---

## 11. Complete Flow Example

### Scenario: Staff creates order at Table 5

1. **User Action:**
   - Staff navigates to `/pos/table-5-id`
   - Enters guest count: 2
   - Clicks "Start Order"

2. **Frontend:**
   - Sets `pendingOrderInfo = { tableId, guestCount: 2 }`
   - Shows menu items

3. **User adds item:**
   - Clicks "Burger" → Modifier dialog opens
   - Selects "Large" variant, adds "Extra Cheese" modifier
   - Clicks "Add to Order"

4. **Order Creation:**
   - `createOrderIfNeeded()` called
   - Since no order exists, calls `createOrder()`
   - API: `POST /api/orders` with first item included

5. **Backend Processing:**
   - Validates request
   - Generates order number: `REST-20241226-001`
   - Creates Order record (status: 'pending')
   - Creates OrderItem record for burger
   - Calculates totals
   - Updates Table status to 'occupied'
   - Emits Socket.IO event

6. **Response:**
   - Returns order with items
   - Frontend updates store
   - UI shows order in cart

7. **User adds more items:**
   - Each item added via `POST /api/orders/:id/items`
   - Order totals recalculated
   - Real-time updates sent to all clients

8. **Send to Kitchen:**
   - User clicks "Send to Kitchen"
   - Order status changes to 'confirmed'
   - KDS displays order
   - Kitchen staff can see and prepare items

---

## 12. Key Design Decisions

1. **Lazy Order Creation:** Order created only when first item is added (not when guest count is entered)

2. **Transaction Safety:** All order creation in database transaction (atomic)

3. **Price Snapshot:** OrderItem stores item name and price at time of order (menu can change later)

4. **Real-time Updates:** Socket.IO ensures all clients see changes immediately

5. **Status Management:** Clear status flow with timestamps for each transition

6. **Multi-source Support:** Orders can come from POS, Waiter App, or online

7. **Modifier Support:** Complex pricing with variants and modifiers

8. **KDS Integration:** Items include KDS station for kitchen routing

---

## 13. Error Handling

- **Validation Errors:** Caught by `orderValidator.validateCreate`
- **Business Logic Errors:** Handled in controllers (e.g., can't add to completed order)
- **Database Errors:** Transaction rollback on failure
- **API Errors:** Frontend catches and displays to user

---

## 14. Testing Considerations

To test order creation:
1. Create order with empty items array
2. Create order with items included
3. Add items to existing order
4. Test with variants and modifiers
5. Test table status updates
6. Test Socket.IO events
7. Test transaction rollback on error
8. Test order number generation uniqueness

---

This flow ensures data consistency, real-time updates, and a smooth user experience across all entry points.

