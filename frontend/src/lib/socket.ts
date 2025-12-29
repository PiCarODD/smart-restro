import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection
 */
export function initSocket(): Socket | null {
  // Don't reconnect if already connected
  if (socket?.connected) {
    return socket;
  }

  // Get auth token and restaurant ID
  const authStore = useAuthStore.getState();
  const user = authStore.user;
  const token = localStorage.getItem('auth_token');

  if (!token || !user?.restaurantId) {
    console.warn('Cannot initialize socket: missing token or restaurantId');
    return null;
  }

  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
  }

  // Create new socket connection
  // Socket.IO URL is the base API URL without /api suffix
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const socketUrl = apiUrl.replace('/api', '');
  socket = io(socketUrl, {
    auth: {
      token,
    },
    query: {
      restaurantId: user.restaurantId,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    // Join restaurant room
    if (user.restaurantId && socket) {
      socket.emit('join:restaurant', user.restaurantId);
      
      // Join KDS room if user is kitchen staff
      if (['kitchen', 'admin', 'manager'].includes(user.role)) {
        socket.emit('join:kds', user.restaurantId);
      }
      
      // Join waiter room if user is a waiter
      if (['waiter', 'server'].includes(user.role)) {
        socket.emit('join:waiter', user.id);
      }
    }
  });

  socket.on('disconnect', () => {
    // Handle disconnect
  });

  socket.on('connect_error', (error: Error) => {
    console.error('Socket.IO connection error:', error);
  });

  socket.on('reconnect', () => {
    // Rejoin rooms after reconnection
    if (user.restaurantId) {
      socket?.emit('join:restaurant', user.restaurantId);
      if (['kitchen', 'admin', 'manager'].includes(user.role)) {
        socket?.emit('join:kds', user.restaurantId);
      }
      if (['waiter', 'server'].includes(user.role)) {
        socket?.emit('join:waiter', user.id);
      }
    }
  });

  return socket;
}

/**
 * Get current socket instance
 */
export function getSocket(): Socket | null {
  if (!socket) {
    return initSocket();
  }
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    try {
      if (socket.connected) {
        socket.disconnect();
      }
      socket = null;
    } catch (error) {
      console.error('Error disconnecting socket:', error);
      socket = null;
    }
  }
}

/**
 * Socket event listeners for orders
 */
export interface OrderSocketEvents {
  'order:created': (order: any) => void;
  'order:status_changed': (data: { orderId: string; status: string; order?: any }) => void;
  'order:ready': (data: { orderId: string; tableId: string; orderNumber: string }) => void;
  'order:cancelled': (data: { orderId: string }) => void;
  'order:sent_to_kitchen': (order: any) => void;
  'order:item_updated': (data: { orderId: string; itemId: string; status: string; orderItem: any }) => void;
}

/**
 * Socket event listeners for tables
 */
export interface TableSocketEvents {
  'table:status_changed': (data: { tableId: string; status: string; orderId?: string; guestCount?: number }) => void;
  'tables:updated': () => void;
}

/**
 * Subscribe to order events
 */
export function subscribeToOrders(callbacks: Partial<OrderSocketEvents>): () => void {
  const currentSocket = getSocket();
  if (!currentSocket) {
    return () => {}; // Return no-op cleanup function
  }

  // Add event listeners
  if (callbacks['order:created']) {
    currentSocket.on('order:created', callbacks['order:created']);
  }
  if (callbacks['order:status_changed']) {
    currentSocket.on('order:status_changed', callbacks['order:status_changed']);
  }
  if (callbacks['order:ready']) {
    currentSocket.on('order:ready', callbacks['order:ready']);
  }
  if (callbacks['order:cancelled']) {
    currentSocket.on('order:cancelled', callbacks['order:cancelled']);
  }
  if (callbacks['order:sent_to_kitchen']) {
    currentSocket.on('order:sent_to_kitchen', callbacks['order:sent_to_kitchen']);
  }
  if (callbacks['order:item_updated']) {
    currentSocket.on('order:item_updated', callbacks['order:item_updated']);
  }

  // Return cleanup function
  return () => {
    if (!currentSocket) return;
    if (callbacks['order:created']) {
      currentSocket.off('order:created', callbacks['order:created']);
    }
    if (callbacks['order:status_changed']) {
      currentSocket.off('order:status_changed', callbacks['order:status_changed']);
    }
    if (callbacks['order:ready']) {
      currentSocket.off('order:ready', callbacks['order:ready']);
    }
    if (callbacks['order:cancelled']) {
      currentSocket.off('order:cancelled', callbacks['order:cancelled']);
    }
    if (callbacks['order:sent_to_kitchen']) {
      currentSocket.off('order:sent_to_kitchen', callbacks['order:sent_to_kitchen']);
    }
    if (callbacks['order:item_updated']) {
      currentSocket.off('order:item_updated', callbacks['order:item_updated']);
    }
  };
}

/**
 * Subscribe to table events
 */
export function subscribeToTables(callbacks: Partial<TableSocketEvents>): () => void {
  const currentSocket = getSocket();
  if (!currentSocket) {
    return () => {}; // Return no-op cleanup function
  }

  // Add event listeners
  if (callbacks['table:status_changed']) {
    currentSocket.on('table:status_changed', callbacks['table:status_changed']);
  }
  if (callbacks['tables:updated']) {
    currentSocket.on('tables:updated', callbacks['tables:updated']);
  }

  // Return cleanup function
  return () => {
    if (!currentSocket) return;
    if (callbacks['table:status_changed']) {
      currentSocket.off('table:status_changed', callbacks['table:status_changed']);
    }
    if (callbacks['tables:updated']) {
      currentSocket.off('tables:updated', callbacks['tables:updated']);
    }
  };
}

