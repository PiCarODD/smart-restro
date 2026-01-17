import apiClient, { getApiError } from './client';

export interface Tax {
  id: string;
  name: string;
  rate: number;
  type: 'percentage' | 'fixed';
  isActive: boolean;
  // appliesTo removed - taxes apply to all orders when enabled
}

/**
 * Taxes API service
 */
export const taxesApi = {
  list: async (): Promise<{ taxes: Tax[] }> => {
    try {
      const response = await apiClient.get<{ taxes: Tax[] }>('/taxes');
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  listFiltered: async (filters?: { activeOnly?: boolean }): Promise<{ taxes: Tax[] }> => {
    try {
      const response = await apiClient.post<{ taxes: Tax[] }>('/taxes/list', filters || {});
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  getById: async (id: string): Promise<{ tax: Tax }> => {
    try {
      const response = await apiClient.get<{ tax: Tax }>(`/taxes/${id}`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  create: async (data: Omit<Tax, 'id'>): Promise<{ tax: Tax }> => {
    try {
      const response = await apiClient.post<{ tax: Tax }>('/taxes', data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  update: async (id: string, data: Partial<Tax>): Promise<{ tax: Tax }> => {
    try {
      const response = await apiClient.put<{ tax: Tax }>(`/taxes/${id}`, data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/taxes/${id}`);
    } catch (error) {
      throw getApiError(error);
    }
  },
};

