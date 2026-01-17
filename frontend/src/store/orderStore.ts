import { create } from 'zustand';
import { Order, OrderItem, OrderStatus, OrderItemStatus } from '@/types';
import { ordersApi, getApiError } from '@/lib/api';
import type { Order as ApiOrder, OrderItem as ApiOrderItem } from '@/lib/api/ordersApi';
import { useAuthStore } from './authStore';
import { useSettingsStore } from './settingsStore';
import { subscribeToOrders } from '@/lib/socket';

interface OrderStore {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;

  // Orders
  loadOrders: (filters?: {
    tableId?: string;
    waiterId?: string;
    status?: string;
    orderType?: string;
    startDate?: string;
    endDate?: string;
    shiftStartDate?: string;
  }) => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByTable: (tableId: string) => Order[];
  getActiveOrderByTable: (tableId: string) => Order | undefined;

  // Order CRUD
  createOrder: (tableId: string, tableName: string, guestCount: number, waiterId?: string, waiterName?: string) => Promise<Order>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
  completeOrder: (id: string) => Promise<void>;

  // Order Items
  addItemToOrder: (orderId: string, item: Omit<OrderItem, 'id' | 'status'>) => Promise<void>;
  updateOrderItem: (orderId: string, itemId: string, updates: Partial<OrderItem>) => Promise<void>;
  removeOrderItem: (orderId: string, itemId: string) => Promise<void>;
  updateItemStatus: (orderId: string, itemId: string, status: OrderItemStatus) => Promise<void>;

  // Current Order (for POS)
  setCurrentOrder: (order: Order | null) => void;
  clearCurrentOrder: () => void;

  // Cart operations for POS
  addToCart: (item: Omit<OrderItem, 'id' | 'status'>) => Promise<void>;
  updateCartItem: (itemId: string, updates: Partial<OrderItem>) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => void;

  // Calculations
  calculateOrderTotals: (items: OrderItem[]) => { subtotal: number; tax: number; total: number };

  // Helpers
  clearError: () => void;

  // Socket Actions
  onOrderCreated: (order: Order) => void;
  onOrderUpdated: (order: Order) => void;
  onOrderCancelled: (orderId: string) => void;
}

/**
 * Debounce helper to prevent too many rapid calls
 */
let debounceTimer: NodeJS.Timeout | null = null;
function debouncedLoadOrders(delay: number = 500) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    const store = useOrderStore.getState();
    if (!store.isLoading) {
      store.loadOrders().catch(error => {
        console.error('Failed to reload orders from socket event:', error);
      });
    }
    debounceTimer = null;
  }, delay);
}

/**
 * Map API Order to Frontend Order
 */
function mapApiOrderToOrder(apiOrder: ApiOrder): Order {
  return {
    id: apiOrder.id,
    orderNumber: apiOrder.orderNumber,
    tableId: apiOrder.tableId || '',
    tableName: apiOrder.table?.tableNumber || apiOrder.table?.name || '',
    waiterId: apiOrder.waiterId,
    waiterName: apiOrder.waiter ? `${apiOrder.waiter.firstName} ${apiOrder.waiter.lastName}` : undefined,
    status: apiOrder.status as OrderStatus,
    items: (apiOrder.orderItems || []).map(mapApiOrderItemToOrderItem),
    subtotal: parseFloat(apiOrder.subtotal?.toString() || '0'),
    tax: parseFloat(apiOrder.taxAmount?.toString() || '0'),
    discount: parseFloat(apiOrder.discountAmount?.toString() || '0'),
    total: parseFloat(apiOrder.totalAmount?.toString() || '0'),
    guestCount: apiOrder.guestCount || 1,
    notes: apiOrder.notes,
    createdAt: new Date(apiOrder.placedAt),
    updatedAt: apiOrder.completedAt ? new Date(apiOrder.completedAt) :
      apiOrder.servedAt ? new Date(apiOrder.servedAt) :
        apiOrder.readyAt ? new Date(apiOrder.readyAt) :
          apiOrder.confirmedAt ? new Date(apiOrder.confirmedAt) :
            new Date(apiOrder.placedAt),
  };
}

/**
 * Map API OrderItem to Frontend OrderItem
 */
function mapApiOrderItemToOrderItem(apiItem: ApiOrderItem): OrderItem {
  // Handle modifiers - they can be objects with name/price or just strings
  const modifiers: Array<{name: string; price: number}> = (apiItem.modifiers || []).map(m => {
    if (typeof m === 'string') {
      // Legacy format - just a string name
      return { name: m, price: 0 };
    }
    // Modern format - object with name and price
    const name = typeof m === 'object' && m !== null && 'name' in m ? String(m.name || m) : String(m);
    const price = typeof m === 'object' && m !== null && 'price' in m 
      ? (typeof m.price === 'number' ? m.price : parseFloat(String(m.price || '0')))
      : 0;
    return { name, price };
  });

  return {
    id: apiItem.id,
    menuItemId: apiItem.menuItemId,
    name: apiItem.itemName,
    quantity: apiItem.quantity,
    unitPrice: apiItem.unitPrice,
    totalPrice: apiItem.totalPrice,
    variant: apiItem.variantName,
    modifiers,
    modifiersTotal: apiItem.modifiersTotal || 0,
    notes: apiItem.notes,
    status: apiItem.status as OrderItemStatus,
  };
}

/**
 * Map Frontend OrderItem to API OrderItem format for creation
 */
function mapOrderItemToApiFormat(item: Omit<OrderItem, 'id' | 'status'>): {
  menuItemId: string;
  variantName?: string;
  quantity: number;
  modifiers?: Array<{ name: string; price: number }>;
  notes?: string;
} {
  // Handle modifiers - they should already be in the correct format
  const modifiers: Array<{ name: string; price: number }> | undefined = item.modifiers?.map(m => {
    if (typeof m === 'string') {
      // Legacy format - convert to object
      return { name: m, price: 0 };
    }
    // Modern format - already correct
    return { name: m.name, price: m.price };
  });

  return {
    menuItemId: item.menuItemId,
    variantName: item.variant,
    quantity: item.quantity,
    modifiers,
    notes: item.notes,
  };
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  loadOrders: async (filters = {}) => {
    // Prevent multiple simultaneous loads
    if (get().isLoading) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const apiFilters: any = { ...filters };
      // Pass shiftStartDate if provided
      if (filters?.shiftStartDate) {
        apiFilters.shiftStartDate = filters.shiftStartDate;
      }
      const response = await ordersApi.list({
        ...apiFilters,
        limit: 100, // Load a reasonable number of orders
      });

      const newOrders = response.orders.map(mapApiOrderToOrder);

      // Only update if orders actually changed (prevent unnecessary re-renders)
      const currentOrders = get().orders;
      const ordersChanged =
        currentOrders.length !== newOrders.length ||
        currentOrders.some((order, idx) => {
          const newOrder = newOrders[idx];
          return !newOrder || order.id !== newOrder.id || order.status !== newOrder.status;
        });

      if (ordersChanged) {
        set({ orders: newOrders, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('[OrderStore] loadOrders: Error occurred', error);
      const apiError = getApiError(error);
      set({ error: apiError.message, isLoading: false });
      throw error;
    }
  },

  getOrderById: (id) => {
    return get().orders.find(order => order.id === id);
  },

  getOrdersByTable: (tableId) => {
    return get().orders.filter(order => order.tableId === tableId);
  },

  getActiveOrderByTable: (tableId) => {
    return get().orders.find(
      order => order.tableId === tableId &&
        !['completed', 'cancelled'].includes(order.status)
    );
  },

  createOrder: async (tableId, tableName, guestCount, waiterId, waiterName) => {
    set({ error: null });
    try {
      const user = useAuthStore.getState().user;

      const response = await ordersApi.create({
        orderType: 'dine_in',
        tableId,
        waiterId: waiterId || user?.id,
        guestCount,
        source: 'pos',
        items: [], // Start with empty items, add them separately
      });

      const order = mapApiOrderToOrder(response.order);

      // Override tableName from parameter since API might return different format
      order.tableName = tableName;
      if (waiterName) order.waiterName = waiterName;

      set(state => ({
        orders: [...state.orders, order],
        currentOrder: order,
      }));

      return order;
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  updateOrder: async (id, updates) => {
    set({ error: null });
    try {
      // Map frontend Order updates to API format
      const apiUpdates: any = {};
      if (updates.status) apiUpdates.status = updates.status;
      if (updates.notes !== undefined) apiUpdates.notes = updates.notes;
      if (updates.guestCount !== undefined) apiUpdates.guestCount = updates.guestCount;

      const response = await ordersApi.update(id, apiUpdates);
      const updatedOrder = mapApiOrderToOrder(response.order);

      set(state => ({
        orders: state.orders.map(order =>
          order.id === id ? updatedOrder : order
        ),
        currentOrder: state.currentOrder?.id === id ? updatedOrder : state.currentOrder,
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  updateOrderStatus: async (id, status) => {
    set({ error: null });
    try {
      const response = await ordersApi.updateStatus(id, status as ApiOrder['status']);
      const updatedOrder = mapApiOrderToOrder(response.order);

      // If the response doesn't include full order details, fetch the complete order
      if (!updatedOrder.items || updatedOrder.items.length === 0) {
        const fullOrderResponse = await ordersApi.getById(id);
        const fullOrder = mapApiOrderToOrder(fullOrderResponse.order);

        set(state => ({
          orders: state.orders.map(order =>
            order.id === id ? fullOrder : order
          ),
          currentOrder: state.currentOrder?.id === id ? fullOrder : state.currentOrder,
        }));
      } else {
        set(state => ({
          orders: state.orders.map(order =>
            order.id === id ? updatedOrder : order
          ),
          currentOrder: state.currentOrder?.id === id ? updatedOrder : state.currentOrder,
        }));
      }
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  cancelOrder: async (id) => {
    set({ error: null });
    try {
      await ordersApi.cancel(id);
      await get().updateOrderStatus(id, 'cancelled');
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  completeOrder: async (id) => {
    await get().updateOrderStatus(id, 'completed');
  },

  addItemToOrder: async (orderId, item) => {
    set({ error: null });
    try {
      const apiItem = mapOrderItemToApiFormat(item);
      await ordersApi.addItem(orderId, apiItem);

      // Reload the order to get updated totals
      const orderResponse = await ordersApi.getById(orderId);
      const updatedOrder = mapApiOrderToOrder(orderResponse.order);

      set(state => ({
        orders: state.orders.map(order =>
          order.id === orderId ? updatedOrder : order
        ),
        currentOrder: state.currentOrder?.id === orderId ? updatedOrder : state.currentOrder,
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  updateOrderItem: async (orderId, itemId, updates) => {
    set({ error: null });
    try {
      // Map frontend updates to API format
      const apiUpdates: any = {};
      if (updates.quantity !== undefined) apiUpdates.quantity = updates.quantity;
      if (updates.notes !== undefined) apiUpdates.notes = updates.notes;

      await ordersApi.updateItem(orderId, itemId, apiUpdates);

      // Reload the order to get updated totals
      const orderResponse = await ordersApi.getById(orderId);
      const updatedOrder = mapApiOrderToOrder(orderResponse.order);

      set(state => ({
        orders: state.orders.map(order =>
          order.id === orderId ? updatedOrder : order
        ),
        currentOrder: state.currentOrder?.id === orderId ? updatedOrder : state.currentOrder,
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  removeOrderItem: async (orderId, itemId) => {
    set({ error: null });
    try {
      await ordersApi.removeItem(orderId, itemId);

      // Reload the order to get updated totals
      const orderResponse = await ordersApi.getById(orderId);
      const updatedOrder = mapApiOrderToOrder(orderResponse.order);

      set(state => ({
        orders: state.orders.map(order =>
          order.id === orderId ? updatedOrder : order
        ),
        currentOrder: state.currentOrder?.id === orderId ? updatedOrder : state.currentOrder,
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  updateItemStatus: async (orderId, itemId, status) => {
    set({ error: null });
    try {
      await ordersApi.updateItemStatus(orderId, itemId, status as ApiOrderItem['status']);

      // Reload the order to get updated item status
      const orderResponse = await ordersApi.getById(orderId);
      const updatedOrder = mapApiOrderToOrder(orderResponse.order);

      set(state => ({
        orders: state.orders.map(order =>
          order.id === orderId ? updatedOrder : order
        ),
        currentOrder: state.currentOrder?.id === orderId ? updatedOrder : state.currentOrder,
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  setCurrentOrder: (order) => {
    set({ currentOrder: order });
  },

  clearCurrentOrder: () => {
    set({ currentOrder: null });
  },

  // Cart operations for building orders in POS
  addToCart: async (item) => {
    const currentOrder = get().currentOrder;
    if (!currentOrder) {
      throw new Error('No current order. Please create an order first.');
    }

    await get().addItemToOrder(currentOrder.id, item);
  },

  updateCartItem: async (itemId, updates) => {
    const currentOrder = get().currentOrder;
    if (!currentOrder) return;

    await get().updateOrderItem(currentOrder.id, itemId, updates);
  },

  removeFromCart: async (itemId) => {
    const currentOrder = get().currentOrder;
    if (!currentOrder) return;

    await get().removeOrderItem(currentOrder.id, itemId);
  },

  clearCart: async () => {
    const currentOrder = get().currentOrder;
    if (!currentOrder) return;

    // Remove all items
    const itemIds = currentOrder.items.map(item => item.id);
    for (const itemId of itemIds) {
      await get().removeOrderItem(currentOrder.id, itemId);
    }
  },

  calculateOrderTotals: (items) => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Get restaurant settings
    const { restaurantInfo } = useSettingsStore.getState();
    const autoApplyTax = restaurantInfo?.autoApplyTax !== false;
    
    // Calculate tax amount using simple tax rate from restaurant settings
    let tax = 0;
    if (autoApplyTax) {
      // Get tax rate from restaurant settings (if available)
      // Note: This is frontend calculation only, actual calculation happens on backend
      const taxRate = 0; // Frontend doesn't have access to settings.operations.taxRate directly
      tax = (subtotal * taxRate) / 100;
    }

    const total = subtotal + tax;
    return { subtotal, tax, total };
  },

  // Socket event handlers
  onOrderCreated: (order: Order) => {
    set(state => {
      // Avoid duplicates
      if (state.orders.some(o => o.id === order.id)) return state;
      return {
        orders: [order, ...state.orders].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      };
    });
  },

  onOrderUpdated: (updatedOrder: Order) => {
    set(state => ({
      orders: state.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o),
      currentOrder: state.currentOrder?.id === updatedOrder.id ? updatedOrder : state.currentOrder
    }));
  },

  onOrderCancelled: (orderId: string) => {
    set(state => ({
      orders: state.orders.map(o =>
        o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o
      ),
      currentOrder: state.currentOrder?.id === orderId
        ? { ...state.currentOrder, status: 'cancelled' as OrderStatus }
        : state.currentOrder
    }));
  }
}));

// Track if subscriptions are already set up to prevent duplicates
let orderSubscriptionsActive = false;
let currentOrderUnsubscribe: (() => void) | null = null;

/**
 * Initialize socket subscriptions for order events
 * This should be called after socket is initialized (e.g., in DashboardLayout)
 */
export function initOrderSocketSubscriptions() {
  // Prevent duplicate subscriptions
  if (orderSubscriptionsActive && currentOrderUnsubscribe) {
    return currentOrderUnsubscribe;
  }

  const store = useOrderStore.getState();

  // Create stable callback references
  const callbacks = {
    'order:created': (order: any) => {
      // socket.io might return raw object, ensure it's mapped if needed
      // Assuming backend returns consistent object structure, but for safety we can map it
      // However, backend send complete order object usually. 
      // Let's assume structure is close enough or use mapApiOrderToOrder if it matches ApiOrder
      // Based on controller, it emits the result of `orderService.createOrder` which is Sequelize model instance. 
      // It might need mapping. Let's try to map it if it looks like API response

      // Best effort mapping - if it has id, treat as order
      if (order && order.id) {
        // We might need to map it if the backend format differs slightly (e.g., dates as strings)
        // But for now, let's trust the backend or run a basic conversion
        const mappedOrder: Order = {
          ...order,
          items: order.orderItems ? order.orderItems.map((item: any) => ({
            id: item.id,
            menuItemId: item.menuItemId,
            name: item.itemName || item.name || 'Unknown',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            variant: item.variantName,
            modifiers: (item.modifiers || []).map((m: any) => {
              if (typeof m === 'string') return { name: m, price: 0 };
              return { name: m.name || m, price: typeof m.price === 'number' ? m.price : parseFloat(m.price?.toString() || '0') };
            }),
            notes: item.notes,
            status: item.status
          })) : [],
          createdAt: new Date(order.createdAt || order.placedAt),
          updatedAt: new Date(order.updatedAt || new Date())
        };
        store.onOrderCreated(mappedOrder);
      } else {
        // Fallback to reload if payload is missing
        debouncedLoadOrders(500);
      }
    },
    'order:status_changed': (data: { orderId: string; status: string; order?: any }) => {
      if (data.order) {
        const order = data.order;
        const mappedOrder: Order = {
          ...order,
          items: order.orderItems ? order.orderItems.map((item: any) => ({
            id: item.id,
            menuItemId: item.menuItemId,
            name: item.itemName || item.name || 'Unknown',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            variant: item.variantName,
            modifiers: (item.modifiers || []).map((m: any) => {
              if (typeof m === 'string') return { name: m, price: 0 };
              return { name: m.name || m, price: typeof m.price === 'number' ? m.price : parseFloat(m.price?.toString() || '0') };
            }),
            notes: item.notes,
            status: item.status
          })) : [],
          createdAt: new Date(order.createdAt || order.placedAt),
          updatedAt: new Date(order.updatedAt || new Date())
        };
        store.onOrderUpdated(mappedOrder);
      } else {
        // Fallback if full order not provided (though controller seems to provide it)
        debouncedLoadOrders(200);
      }
    },
    'order:item_updated': () => debouncedLoadOrders(500), // Item updates are complex, safer to reload
    'order:ready': (_data: { orderId: string }) => {
      // Status change handles this, but redundant listener might exist. 
      // We can just rely on status_changed mostly.
    },
    'order:cancelled': (data: { orderId: string }) => {
      store.onOrderCancelled(data.orderId);
    },
    'order:sent_to_kitchen': (data: { order: any }) => {
      if (data.order) {
        // Similar mapping to update
        // ... mapping logic redundant, maybe extract? 
        // For now just reload to be safe and simple for this complex event
        debouncedLoadOrders(500);
      }
    },
  };

  const unsubscribe = subscribeToOrders(callbacks);

  // Store unsubscribe function and mark as active
  currentOrderUnsubscribe = () => {
    unsubscribe();
    orderSubscriptionsActive = false;
    currentOrderUnsubscribe = null;
  };

  orderSubscriptionsActive = true;

  return currentOrderUnsubscribe;
}
