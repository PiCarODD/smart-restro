import apiClient, { getApiError } from './client';

export interface FeatureToggle {
  id: string;
  featureKey: string;
  enabled: boolean;
  config?: Record<string, any>;
}

/**
 * Features API service
 */
export const featuresApi = {
  list: async (): Promise<{ toggles: FeatureToggle[] }> => {
    try {
      const response = await apiClient.get<{ toggles: FeatureToggle[] }>('/features');
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  getById: async (id: string): Promise<{ toggle: FeatureToggle }> => {
    try {
      const response = await apiClient.get<{ toggle: FeatureToggle }>(`/features/${id}`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  upsert: async (featureKey: string, data: {
    enabled?: boolean;
    config?: Record<string, any>;
  }): Promise<{ toggle: FeatureToggle }> => {
    try {
      const response = await apiClient.put<{ toggle: FeatureToggle }>(`/features/${featureKey}`, data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  toggle: async (id: string): Promise<{ toggle: FeatureToggle }> => {
    try {
      const response = await apiClient.patch<{ toggle: FeatureToggle }>(`/features/${id}/toggle`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/features/${id}`);
    } catch (error) {
      throw getApiError(error);
    }
  },
};

