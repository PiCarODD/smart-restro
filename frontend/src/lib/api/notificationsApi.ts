import apiClient, { getApiError } from './client';

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

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}

/**
 * Notifications API service
 */
export const notificationsApi = {
  /**
   * Get user's notifications
   */
  getNotifications: async (params?: {
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<NotificationListResponse> => {
    try {
      const response = await apiClient.get<NotificationListResponse>('/notifications', { params });
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
      const response = await apiClient.put<{ message: string; notification: Notification }>(`/notifications/${notificationId}/read`);
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
      const response = await apiClient.put<{ message: string }>('/notifications/read-all');
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },
};
