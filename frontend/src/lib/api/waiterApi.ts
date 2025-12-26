import apiClient, { getApiError } from './client';
import { Table, Order } from '@/types';

export interface WaiterTable extends Table {
  currentOrder?: {
    id: string;
    orderNumber: string;
    status: string;
    guestCount: number;
    placedAt: string;
  };
}

export interface WaiterOrder extends Order {
  table?: {
    id: string;
    tableNumber: string;
    name?: string;
  };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

/**
 * Waiter API service
 */
export const waiterApi = {
  /**
   * Get assigned tables
   */
  getTables: async (): Promise<{ tables: WaiterTable[] }> => {
    try {
      const response = await apiClient.get<{ tables: WaiterTable[] }>('/waiter/tables');
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Get waiter's active orders
   */
  getOrders: async (params?: {
    status?: string;
  }): Promise<{ orders: WaiterOrder[] }> => {
    try {
      const response = await apiClient.get<{ orders: WaiterOrder[] }>('/waiter/orders', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Create order from table
   */
  createOrder: async (data: {
    tableId: string;
    guestCount?: number;
    items?: Array<{
      menuItemId: string;
      variantName?: string;
      quantity: number;
      modifiers?: Array<{ name: string; price?: number }>;
      notes?: string;
      kdsStation?: string;
      course?: number;
    }>;
  }): Promise<{ message: string; order: Order }> => {
    try {
      const response = await apiClient.post<{ message: string; order: Order }>('/waiter/orders', data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Get waiter's notifications
   */
  getNotifications: async (params?: {
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<{ notifications: Notification[]; unreadCount: number }> => {
    try {
      const response = await apiClient.get<{ notifications: Notification[]; unreadCount: number }>('/waiter/notifications', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Mark notification as read
   */
  markNotificationRead: async (notificationId: string): Promise<{ message: string; notification: Notification }> => {
    try {
      const response = await apiClient.put<{ message: string; notification: Notification }>(`/waiter/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead: async (): Promise<{ message: string }> => {
    try {
      const response = await apiClient.put<{ message: string }>('/waiter/notifications/read-all');
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },
};

