import { create } from 'zustand';
import { Order, OrderItem, OrderStatus, OrderItemStatus } from '@/types';
import { ordersApi, getApiError } from '@/lib/api';
import type { Order as ApiOrder, OrderItem as ApiOrderItem } from '@/lib/api/ordersApi';
import { useAuthStore } from './authStore';

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
    subtotal: apiOrder.subtotal,
    tax: apiOrder.taxAmount,
    discount: apiOrder.discountAmount,
    total: apiOrder.totalAmount,
    guestCount: apiOrder.guestCount,
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
  return {
    id: apiItem.id,
    menuItemId: apiItem.menuItemId,
    name: apiItem.itemName,
    quantity: apiItem.quantity,
    unitPrice: apiItem.unitPrice,
    totalPrice: apiItem.totalPrice,
    variant: apiItem.variantName,
    modifiers: (apiItem.modifiers || []).map(m => m.name),
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
  return {
    menuItemId: item.menuItemId,
    variantName: item.variant,
    quantity: item.quantity,
    modifiers: item.modifiers?.map(name => ({ name, price: 0 })), // Price should come from menu item
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
      const response = await ordersApi.list({
        ...filters,
        limit: 100, // Load a reasonable number of orders
      });
      
      const orders = response.orders.map(mapApiOrderToOrder);
      set({ orders, isLoading: false });
    } catch (error) {
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
    // Tax calculation should ideally come from backend or tax settings
    // For now, using a simple calculation
    const tax = subtotal * 0.08; // 8% default tax
    const total = subtotal + tax;
    return { subtotal, tax, total };
  },
}));
