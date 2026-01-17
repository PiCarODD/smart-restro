# Socket.IO Integration

## Overview

Socket.IO provides real-time bidirectional communication between the frontend and backend, enabling instant updates for orders, tables, and notifications.

## Architecture

### Server Setup

**File**: `backend/src/app.js`

```javascript
const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify JWT token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.userId = decoded.userId;
  socket.restaurantId = decoded.restaurantId;
  socket.role = decoded.role;
  next();
});
```

### Client Setup

**File**: `frontend/src/lib/socket.ts`

```typescript
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (token: string, restaurantId: string) => {
  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });
  
  socket.on('connect', () => {
    socket?.emit('join:restaurant', { restaurantId });
  });
  
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

## Rooms

### Room Structure

Rooms organize socket connections by context:

- **`restaurant:{restaurantId}`**: Restaurant-wide events
- **`kds:{restaurantId}`**: Kitchen Display System
- **`waiter:{waiterId}`**: Waiter-specific events
- **`table:{tableId}`**: Table-specific events

### Joining Rooms

**Server**:
```javascript
socket.on('join:restaurant', ({ restaurantId }) => {
  socket.join(`restaurant:${restaurantId}`);
});

socket.on('join:kds', ({ restaurantId }) => {
  socket.join(`kds:${restaurantId}`);
});

socket.on('join:waiter', ({ waiterId }) => {
  socket.join(`waiter:${waiterId}`);
});
```

**Client**:
```typescript
socket.emit('join:restaurant', { restaurantId });
socket.emit('join:kds', { restaurantId });
socket.emit('join:waiter', { waiterId });
```

## Events

### Order Events

#### order:created
Emitted when a new order is created.

**Server**:
```javascript
io.to(`restaurant:${restaurantId}`).emit('order:created', order);
io.to(`kds:${restaurantId}`).emit('order:created', order);
```

**Client**:
```typescript
socket.on('order:created', (order: Order) => {
  // Update orders list
  orderStore.addOrder(order);
});
```

#### order:status_changed
Emitted when order status changes.

**Server**:
```javascript
io.to(`restaurant:${restaurantId}`).emit('order:status_changed', {
  orderId,
  status: newStatus,
  order: updatedOrder
});
```

**Client**:
```typescript
socket.on('order:status_changed', ({ orderId, status, order }) => {
  orderStore.updateOrder(orderId, { status });
});
```

#### order:item_updated
Emitted when order item status changes (for KDS).

**Server**:
```javascript
io.to(`kds:${restaurantId}`).emit('order:item_updated', {
  orderId,
  itemId,
  status: newStatus
});
```

### Table Events

#### table:status_changed
Emitted when table status changes.

**Server**:
```javascript
io.to(`restaurant:${restaurantId}`).emit('table:status_changed', {
  tableId,
  status: newStatus,
  table: updatedTable
});
```

**Client**:
```typescript
socket.on('table:status_changed', ({ tableId, status, table }) => {
  tableStore.updateTable(tableId, { status });
});
```

## Integration with Controllers

### Emitting Events from Controllers

**File**: `backend/src/controllers/orderController.js`

```javascript
const createOrder = async (req, res) => {
  try {
    const order = await Order.create({ ... });
    
    // Emit to restaurant room
    req.io.to(`restaurant:${req.restaurantId}`).emit('order:created', order);
    
    // Emit to KDS room
    req.io.to(`kds:${req.restaurantId}`).emit('order:created', order);
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Passing IO to Controllers

**File**: `backend/src/middleware/socket.js`

```javascript
const attachSocketIO = (io) => {
  return (req, res, next) => {
    req.io = io;
    next();
  };
};

module.exports = { attachSocketIO };
```

**File**: `backend/src/app.js`

```javascript
const { attachSocketIO } = require('./middleware/socket');
app.use(attachSocketIO(io));
```

## Frontend Store Integration

### Order Store

**File**: `frontend/src/store/orderStore.ts`

```typescript
import { subscribeToOrders } from '../lib/socket';

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  
  initOrderSocketSubscriptions: () => {
    const unsubscribe = subscribeToOrders((order) => {
      // Refresh orders list
      get().loadOrders();
    });
    
    return unsubscribe;
  },
}));
```

### Socket Subscription Helper

**File**: `frontend/src/lib/socket.ts`

```typescript
export const subscribeToOrders = (
  callback: (order: Order) => void
): (() => void) => {
  if (!socket) return () => {};
  
  const handlers = {
    'order:created': callback,
    'order:status_changed': callback,
    'order:item_updated': callback,
    'order:ready': callback,
    'order:cancelled': callback,
  };
  
  Object.entries(handlers).forEach(([event, handler]) => {
    socket?.on(event, handler);
  });
  
  // Return unsubscribe function
  return () => {
    Object.keys(handlers).forEach((event) => {
      socket?.off(event);
    });
  };
};
```

## Connection Management

### Initialize on Login

**File**: `frontend/src/components/layout/DashboardLayout.tsx`

```typescript
useEffect(() => {
  if (user && token) {
    const socket = initSocket(token, user.restaurantId);
    
    // Initialize subscriptions
    const unsubscribeOrders = orderStore.initOrderSocketSubscriptions();
    const unsubscribeTables = tableStore.initTableSocketSubscriptions();
    
    return () => {
      unsubscribeOrders();
      unsubscribeTables();
      disconnectSocket();
    };
  }
}, [user, token]);
```

### Cleanup on Logout

**File**: `frontend/src/store/authStore.ts`

```typescript
const logout = () => {
  disconnectSocket();
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  setUser(null);
  setAuthenticated(false);
};
```

## Error Handling

### Connection Errors

```typescript
socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
  // Show user-friendly message
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
  // Attempt reconnection
});
```

### Reconnection Strategy

```typescript
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  // Rejoin rooms
  socket.emit('join:restaurant', { restaurantId });
});
```

## Best Practices

### 1. Room Management
- Join appropriate rooms based on user role
- Leave rooms when component unmounts
- Rejoin rooms on reconnection

### 2. Event Naming
- Use consistent naming: `resource:action`
- Examples: `order:created`, `table:status_changed`
- Document all events

### 3. Payload Size
- Keep event payloads small
- Send only necessary data
- Use IDs and fetch full data if needed

### 4. Error Handling
- Handle connection errors gracefully
- Show user-friendly messages
- Implement retry logic

### 5. Testing
- Test socket connections
- Test room joining/leaving
- Test event emission/reception
- Test reconnection scenarios

## Troubleshooting

### Events Not Received

1. **Check room membership**: Verify socket joined correct room
2. **Check event names**: Ensure client/server use same event names
3. **Check authentication**: Verify JWT token is valid
4. **Check network**: Verify WebSocket connection is active

### Connection Issues

1. **Check CORS**: Verify CORS allows socket origin
2. **Check authentication**: Verify token in handshake
3. **Check server**: Verify Socket.IO server is running
4. **Check firewall**: Verify WebSocket ports are open

## Related Documentation

- [Frontend-Backend Integration](./01-frontend-backend-integration.md)
- [Order Management](../02-features/02-order-management.md)
- [Kitchen Display System](../02-features/01-kitchen-display-system.md)


