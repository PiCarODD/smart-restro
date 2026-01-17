# Order Management System

## Overview

The Order Management System handles the complete order lifecycle from creation to completion, supporting multiple order entry modes and payment processing.

## Order Entry Modes

### Mode A: Management Portal Orders
**Best for**: Small restaurants, direct POS entry

**Features**:
- Direct order entry from POS terminal
- Table management with visual floor plan
- Quick order buttons for popular items
- Order modification and cancellation
- Split bill functionality
- Print receipts

**Access**: Management portal → POS page

### Mode B: Waiter App Orders
**Best for**: Large restaurants with waitstaff

**Features**:
- QR code per table for external access
- Mobile-optimized UI for waiters
- Real-time sync with main system
- Table assignment to waiters
- Order notes per item
- Course timing (fire courses at right time)
- Guest count tracking

**Access**: Waiter app → Order page

**External Link Format**:
```
https://yourrestaurant.smartresto.com/waiter/{waiter-id}/table/{table-id}
```

## Order Workflow

### Status Flow
```
pending → confirmed → preparing → ready → served → completed
```

### Status Descriptions
- **pending**: Order created, awaiting confirmation
- **confirmed**: Order confirmed, sent to kitchen
- **preparing**: Kitchen is preparing the order
- **ready**: Order ready for pickup/serving
- **served**: Order served to customer
- **completed**: Order completed, payment processed
- **cancelled**: Order cancelled (can occur at any stage)

## Order Structure

### Order Entity
```typescript
interface Order {
  id: string;
  orderNumber: string;        // Auto-generated (ORD-001)
  tableId: string;
  waiterId?: string;          // Optional, for waiter app
  status: OrderStatus;
  orderType: 'dine-in' | 'takeout' | 'delivery';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}
```

### Order Item
```typescript
interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  modifications?: Modifier[];
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  station?: string;          // For KDS routing
}
```

## Order Operations

### Create Order
1. Select table
2. Add menu items
3. Apply modifications (if any)
4. Add notes
5. Confirm order
6. Order sent to kitchen (if KDS enabled)

### Modify Order
- Add items to existing order
- Remove items (before preparation)
- Update quantities
- Change modifications
- Update notes

### Cancel Order
- Full cancellation (before preparation)
- Partial cancellation (remove items)
- Cancellation reason required
- Automatic inventory restoration (if auto-deduction enabled)

### Split Order
- Split by items
- Split by amount
- Equal split
- Multiple payment methods

### Transfer Order
- Move order to different table
- Merge orders from same table
- Split table orders

## Payment Processing

### Payment Methods
- **Cash**: Physical cash payment
- **Card**: Credit/debit card
- **Mobile Wallet**: Digital payment apps
- **Split Payment**: Multiple methods per order

### Payment Flow
1. Order marked as "ready for payment"
2. Select payment method(s)
3. Enter amount(s)
4. Process payment
5. Generate receipt
6. Order status → "completed"

### Receipt Generation
- Digital receipt (email/SMS)
- Print receipt (thermal printer)
- Receipt includes:
  - Order number
  - Items and prices
  - Tax breakdown
  - Payment method
  - Date/time

## API Endpoints

### POST /api/orders
Create a new order.

**Request Body**:
```json
{
  "tableId": "uuid",
  "waiterId": "uuid",  // Optional
  "orderType": "dine-in",
  "items": [
    {
      "menuItemId": "uuid",
      "quantity": 2,
      "modifications": [],
      "notes": "No onions"
    }
  ],
  "notes": "Table 5"
}
```

### GET /api/orders
Get orders list.

**Query Parameters**:
- `status`: Filter by status
- `tableId`: Filter by table
- `waiterId`: Filter by waiter
- `date`: Filter by date
- `page`: Pagination page
- `limit`: Items per page

### GET /api/orders/:id
Get order details.

### PATCH /api/orders/:id
Update order.

**Request Body**:
```json
{
  "status": "confirmed",
  "items": [...],
  "notes": "Updated notes"
}
```

### POST /api/orders/:id/items
Add items to existing order.

### DELETE /api/orders/:id/items/:itemId
Remove item from order.

### PATCH /api/orders/:id/status
Update order status.

**Request Body**:
```json
{
  "status": "preparing"
}
```

### POST /api/orders/:id/split
Split order.

**Request Body**:
```json
{
  "type": "by_items",  // or "by_amount", "equal"
  "splits": [
    {
      "itemIds": ["uuid1", "uuid2"],
      "amount": 50.00
    }
  ]
}
```

### POST /api/orders/:id/payment
Process payment.

**Request Body**:
```json
{
  "payments": [
    {
      "method": "cash",
      "amount": 100.00
    }
  ],
  "tip": 10.00
}
```

## Real-Time Updates

### Socket.IO Events

**Emitted Events**:
- `order:created` - New order created
- `order:status_changed` - Order status updated
- `order:item_updated` - Order item status changed
- `order:ready` - Order ready for waiter
- `order:cancelled` - Order cancelled
- `order:sent_to_kitchen` - Order sent to kitchen

**Subscribed Rooms**:
- `restaurant:{restaurantId}` - Restaurant-wide events
- `waiter:{waiterId}` - Waiter-specific events
- `kds:{restaurantId}` - Kitchen display events

## Inventory Integration

### Auto Stock Deduction
When enabled, inventory is automatically deducted when:
- Order is placed (configurable)
- Order is confirmed
- Order is completed

**Configuration**: Settings → Feature Toggles → Auto Stock Deduction

### Recipe Mapping
Each menu item has a recipe mapping to ingredients:
- When order item is completed, ingredients are deducted
- Unit conversion handled automatically
- Low stock alerts triggered if needed

## Best Practices

### Order Creation
- Always verify table status before creating order
- Check item availability before adding
- Validate quantities and prices
- Handle modifications correctly

### Order Updates
- Use optimistic UI updates
- Handle errors gracefully
- Show loading states
- Provide user feedback

### Payment Processing
- Validate payment amounts
- Handle split payments correctly
- Generate receipts immediately
- Update order status after payment

## Related Documentation

- [Kitchen Display System](./01-kitchen-display-system.md)
- [Inventory Management](./03-inventory-management.md)
- [Table Management](./05-table-management.md)
- [Socket.IO Integration](../07-integration/02-socket-io-integration.md)


