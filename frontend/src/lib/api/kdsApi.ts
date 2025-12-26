import apiClient, { getApiError } from './client';
import { Order, OrderItem } from './ordersApi';

export interface KDSStats {
  confirmed: number;
  preparing: number;
  ready: number;
  averagePrepTime: number; // in minutes
}

export interface KDSOrdersResponse {
  orders: Order[];
}

export interface KDSHistoryResponse {
  orders: Order[];
}

export interface KDSStatsResponse {
  stats: KDSStats;
}

/**
 * KDS (Kitchen Display System) API service
 */
export const kdsApi = {
  /**
   * Get active orders for KDS
   * @param station - Optional station filter (e.g., 'grill', 'salad', 'drinks')
   * @param status - Optional status filter ('confirmed', 'preparing', 'ready')
   */
  getOrders: async (params?: {
    station?: string;
    status?: 'confirmed' | 'preparing' | 'ready';
  }): Promise<KDSOrdersResponse> => {
    try {
      const response = await apiClient.get<KDSOrdersResponse>('/kds/orders', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Update order item status
   * @param itemId - Order item ID
   * @param status - New status ('pending', 'preparing', 'ready', 'served', 'cancelled')
   */
  updateItemStatus: async (
    itemId: string,
    status: OrderItem['status']
  ): Promise<{ orderItem: OrderItem }> => {
    try {
      const response = await apiClient.put<{ orderItem: OrderItem }>(
        `/kds/items/${itemId}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Bump order (mark as served/completed)
   * @param orderId - Order ID
   */
  bumpOrder: async (orderId: string): Promise<{ order: Order }> => {
    try {
      const response = await apiClient.post<{ order: Order }>(`/kds/orders/${orderId}/bump`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Get KDS history (recent completed orders)
   * @param limit - Number of orders to return (default: 20)
   */
  getHistory: async (limit?: number): Promise<KDSHistoryResponse> => {
    try {
      const response = await apiClient.get<KDSHistoryResponse>('/kds/history', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Get KDS statistics
   */
  getStats: async (): Promise<KDSStatsResponse> => {
    try {
      const response = await apiClient.get<KDSStatsResponse>('/kds/stats');
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },
};

