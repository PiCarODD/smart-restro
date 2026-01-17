# Kitchen Display System (KDS)

## Overview

The Kitchen Display System (KDS) is a real-time order display system designed for kitchen staff. It provides a visual interface for viewing, managing, and tracking orders as they move through the kitchen workflow.

## Features

### Real-Time Order Display
- Orders appear instantly when placed
- Automatic updates via Socket.IO
- No page refresh required
- Multi-screen support

### Order Priority System
Orders are color-coded based on wait time:
- **Green**: 0-15 minutes (normal)
- **Yellow**: 15-25 minutes (approaching limit)
- **Red**: 25+ minutes (urgent)

### Station Routing
Orders can be routed to specific kitchen stations:
- **Grill Station**: Grilled items
- **Fryer Station**: Fried items
- **Prep Station**: Salads, cold items
- **Expeditor Station**: Final assembly
- **All Orders View**: Complete order overview

### Bump System
- Mark individual items as complete
- Mark entire orders as complete
- Visual feedback on completion
- Order recall for completed orders

### Audio Alerts
- Sound notification for new orders
- Configurable alert settings
- Different sounds for priority orders

## Technical Implementation

### Frontend (KDS PWA)
- **Location**: `frontend/src/pages/kds/`
- **Components**:
  - `KDSPage.tsx` - Main KDS interface
  - `KDSStandalonePage.tsx` - Full-screen KDS mode
- **Features**:
  - Progressive Web App (PWA)
  - Offline capability
  - Auto-refresh on connection restore

### Backend API
- **Endpoint**: `/api/kds/*`
- **Controller**: `kdsController.js`
- **Routes**: `routes/kds.js`

### Real-Time Updates
- **Socket Events**:
  - `order:created` - New order received
  - `order:status_changed` - Order status updated
  - `order:item_updated` - Item status changed
  - `order:ready` - Order ready for pickup
  - `order:sent_to_kitchen` - Order sent to kitchen

### Order Status Workflow
```
pending → confirmed → preparing → ready → served → completed
```

## Configuration

### Feature Toggle
- **Setting**: `enable_kds` in restaurant settings
- **Access**: Settings → Feature Toggles
- **Subscription**: Professional tier and above

### KDS Settings
- **Dark Mode**: Optimized for kitchen lighting
- **Auto-refresh**: Automatic order updates
- **Sound Alerts**: Enable/disable audio notifications
- **Station Filter**: Show only specific station orders

## User Roles

### Kitchen Staff
- **Permissions**: View orders, update item status
- **Access**: KDS page only
- **Actions**: Bump items, mark orders ready

### Manager
- **Permissions**: All kitchen staff permissions
- **Additional**: View all stations, order history

## API Endpoints

### GET /api/kds/orders
Get active orders for KDS display.

**Query Parameters**:
- `station` (optional): Filter by station
- `status` (optional): Filter by order status

**Response**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "orderNumber": "ORD-001",
        "tableName": "Table 5",
        "items": [
          {
            "id": "uuid",
            "menuItemName": "Grilled Chicken",
            "quantity": 2,
            "status": "preparing",
            "station": "grill",
            "notes": "Well done"
          }
        ],
        "createdAt": "2024-12-30T10:00:00Z",
        "priority": "green"
      }
    ]
  }
}
```

### PATCH /api/kds/orders/:orderId/items/:itemId/status
Update order item status.

**Request Body**:
```json
{
  "status": "ready"
}
```

### PATCH /api/kds/orders/:orderId/status
Update entire order status.

**Request Body**:
```json
{
  "status": "ready"
}
```

## Socket.IO Events

### Emitted Events (Client → Server)
- `kds:join` - Join KDS room for restaurant
- `kds:item:update` - Update item status
- `kds:order:update` - Update order status

### Received Events (Server → Client)
- `order:created` - New order created
- `order:status_changed` - Order status changed
- `order:item_updated` - Item status updated
- `order:ready` - Order ready for waiter

## Best Practices

### Performance
- Limit displayed orders (e.g., last 50)
- Use pagination for order history
- Optimize images for menu items
- Cache menu item data

### User Experience
- Large, readable fonts
- High contrast colors
- Clear visual hierarchy
- Minimal clicks for actions

### Reliability
- Handle connection loss gracefully
- Queue updates when offline
- Sync when connection restored
- Error handling for failed updates

## Troubleshooting

### Orders Not Appearing
1. Check Socket.IO connection status
2. Verify restaurant ID in JWT token
3. Check order status (only active orders shown)
4. Verify KDS feature toggle is enabled

### Real-Time Updates Not Working
1. Check browser console for Socket.IO errors
2. Verify server Socket.IO configuration
3. Check network connectivity
4. Verify room subscription

## Related Documentation

- [Order Management](./02-order-management.md)
- [Socket.IO Integration](../07-integration/02-socket-io-integration.md)
- [API Documentation](../03-api/01-api-overview.md)


