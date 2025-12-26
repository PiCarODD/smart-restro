import apiClient, { getApiError } from './client';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscriptionTier: 'starter' | 'professional' | 'enterprise';
  subscriptionStatus: string;
  maxUsers: number;
  maxMenuItems: number;
  maxRestaurants: number;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tenant API service
 */
export const tenantApi = {
  /**
   * Get current user's tenant
   */
  getCurrent: async (): Promise<{ tenant: Tenant }> => {
    try {
      const response = await apiClient.get<{ tenant: Tenant }>('/tenant/me');
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Update subscription tier
   */
  updateSubscription: async (subscriptionTier: 'starter' | 'professional' | 'enterprise'): Promise<{ tenant: Tenant; message: string }> => {
    try {
      const response = await apiClient.put<{ tenant: Tenant; message: string }>('/tenant/me/subscription', {
        subscriptionTier,
      });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },
};

