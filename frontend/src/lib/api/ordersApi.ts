import apiClient, { getApiError } from './client';

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  itemName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers?: Array<{ name: string; price: number }>;
  modifiersTotal: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  kdsStation?: string;
  startedAt?: string;
  readyAt?: string;
  course: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  orderNumber: string;
  orderType: 'dine_in' | 'takeout' | 'delivery';
  tableId?: string;
  waiterId?: string;
  cashierId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  guestCount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  placedAt: string;
  confirmedAt?: string;
  readyAt?: string;
  servedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  subtotal: number;
  discountAmount: number;
  discountReason?: string;
  taxAmount: number;
  serviceCharge: number;
  tipAmount: number;
  totalAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  notes?: string;
  kitchenNotes?: string;
  source: 'pos' | 'waiter_app' | 'self_order' | 'online';
  orderItems?: OrderItem[];
  table?: { id: string; tableNumber: string; name?: string };
  waiter?: { id: string; firstName: string; lastName: string };
}

export interface CreateOrderRequest {
  orderType?: 'dine_in' | 'takeout' | 'delivery';
  tableId?: string;
  waiterId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  guestCount?: number;
  source?: 'pos' | 'waiter_app' | 'self_order' | 'online';
  notes?: string;
  kitchenNotes?: string;
  items: Array<{
    menuItemId: string;
    variantName?: string;
    quantity: number;
    modifiers?: Array<{ name: string; price: number }>;
    notes?: string;
    kdsStation?: string;
    course?: number;
    fireAt?: string;
  }>;
}

export interface OrderListResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Orders API service
 */
export const ordersApi = {
  list: async (params?: {
    tableId?: string;
    waiterId?: string;
    status?: string;
    orderType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<OrderListResponse> => {
    try {
      const response = await apiClient.get<OrderListResponse>('/orders', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  getById: async (id: string): Promise<{ order: Order }> => {
    try {
      const response = await apiClient.get<{ order: Order }>(`/orders/${id}`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  create: async (data: CreateOrderRequest): Promise<{ order: Order }> => {
    try {
      const response = await apiClient.post<{ order: Order }>('/orders', data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  update: async (id: string, data: Partial<Order>): Promise<{ order: Order }> => {
    try {
      const response = await apiClient.put<{ order: Order }>(`/orders/${id}`, data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  updateStatus: async (id: string, status: Order['status']): Promise<{ order: Order }> => {
    try {
      const response = await apiClient.put<{ order: Order }>(`/orders/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  cancel: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/orders/${id}`);
    } catch (error) {
      throw getApiError(error);
    }
  },

  sendToKitchen: async (id: string): Promise<{ order: Order }> => {
    try {
      const response = await apiClient.post<{ order: Order }>(`/orders/${id}/send-to-kitchen`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  split: async (id: string, itemIds: string[]): Promise<{ originalOrder: Order; newOrder: Order }> => {
    try {
      const response = await apiClient.post<{ originalOrder: Order; newOrder: Order }>(`/orders/${id}/split`, {
        itemIds,
      });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  transfer: async (id: string, tableId: string): Promise<{ order: Order }> => {
    try {
      const response = await apiClient.post<{ order: Order }>(`/orders/${id}/transfer`, { tableId });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  merge: async (id: string, orderIds: string[]): Promise<{ order: Order }> => {
    try {
      const response = await apiClient.post<{ order: Order }>(`/orders/${id}/merge`, { orderIds });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  // Order Items
  addItem: async (orderId: string, item: CreateOrderRequest['items'][0]): Promise<{ orderItem: OrderItem }> => {
    try {
      const response = await apiClient.post<{ orderItem: OrderItem }>(`/orders/${orderId}/items`, item);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  updateItem: async (
    orderId: string,
    itemId: string,
    data: Partial<OrderItem>
  ): Promise<{ orderItem: OrderItem }> => {
    try {
      const response = await apiClient.put<{ orderItem: OrderItem }>(`/orders/${orderId}/items/${itemId}`, data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  removeItem: async (orderId: string, itemId: string): Promise<void> => {
    try {
      await apiClient.delete(`/orders/${orderId}/items/${itemId}`);
    } catch (error) {
      throw getApiError(error);
    }
  },

  updateItemStatus: async (
    orderId: string,
    itemId: string,
    status: OrderItem['status']
  ): Promise<{ orderItem: OrderItem }> => {
    try {
      const response = await apiClient.put<{ orderItem: OrderItem }>(
        `/orders/${orderId}/items/${itemId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },
};

