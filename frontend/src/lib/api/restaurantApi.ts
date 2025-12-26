import apiClient, { getApiError } from './client';

export interface Restaurant {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  timezone?: string;
  currency?: string;
  settings?: Record<string, any>;
  isActive: boolean;
  subscriptionTier?: 'starter' | 'professional' | 'enterprise';
  subscriptionStatus?: string;
}

export interface RestaurantSettings {
  operatingHours?: Record<string, any>;
  reservationSettings?: Record<string, any>;
  deliverySettings?: Record<string, any>;
  paymentSettings?: Record<string, any>;
  notificationSettings?: Record<string, any>;
  [key: string]: any;
}

/**
 * Restaurant API service
 */
export const restaurantApi = {
  list: async (): Promise<{ restaurants: Restaurant[] }> => {
    try {
      const response = await apiClient.get<{ restaurants: Restaurant[] }>('/restaurants');
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  getById: async (): Promise<{ restaurant: Restaurant }> => {
    try {
      // Get current user's restaurant - no ID needed, uses JWT token
      const response = await apiClient.get<{ restaurant: Restaurant }>('/restaurants/me');
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  update: async (data: Partial<Restaurant>): Promise<{ restaurant: Restaurant }> => {
    try {
      // Update current user's restaurant - no ID needed, uses JWT token
      const response = await apiClient.put<{ restaurant: Restaurant }>('/restaurants/me', data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  getSettings: async (): Promise<{ settings: RestaurantSettings }> => {
    try {
      // Get current user's restaurant settings - no ID needed, uses JWT token
      const response = await apiClient.get<{ settings: RestaurantSettings }>('/restaurants/me/settings');
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  updateSettings: async (settings: RestaurantSettings): Promise<{ restaurant: Restaurant }> => {
    try {
      // Update current user's restaurant settings - no ID needed, uses JWT token
      const response = await apiClient.put<{ restaurant: Restaurant }>('/restaurants/me/settings', { settings });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  uploadLogo: async (logoFile: File): Promise<{ restaurant: Restaurant }> => {
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      // Upload logo for current user's restaurant - no ID needed, uses JWT token
      const response = await apiClient.put<{ restaurant: Restaurant }>(
        '/restaurants/me/logo',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },
};

