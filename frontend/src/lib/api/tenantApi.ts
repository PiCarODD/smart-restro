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
};

