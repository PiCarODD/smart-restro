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

  getById: async (id: string): Promise<{ restaurant: Restaurant }> => {
    try {
      const response = await apiClient.get<{ restaurant: Restaurant }>(`/restaurants/${id}`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  update: async (id: string, data: Partial<Restaurant>): Promise<{ restaurant: Restaurant }> => {
    try {
      const response = await apiClient.put<{ restaurant: Restaurant }>(`/restaurants/${id}`, data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  getSettings: async (id: string): Promise<{ settings: RestaurantSettings }> => {
    try {
      const response = await apiClient.get<{ settings: RestaurantSettings }>(`/restaurants/${id}/settings`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  updateSettings: async (id: string, settings: RestaurantSettings): Promise<{ restaurant: Restaurant }> => {
    try {
      const response = await apiClient.put<{ restaurant: Restaurant }>(`/restaurants/${id}/settings`, { settings });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  uploadLogo: async (id: string, logoFile: File): Promise<{ restaurant: Restaurant }> => {
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await apiClient.put<{ restaurant: Restaurant }>(
        `/restaurants/${id}/logo`,
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

