import apiClient, { getApiError } from './client';

export interface Section {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Table {
  id: string;
  restaurantId: string;
  sectionId?: string;
  tableNumber: string;
  name?: string;
  section?: string;
  floor: number;
  capacity: number;
  shape?: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'blocked';
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  rotation?: number;
  externalToken?: string;
  qrCodeUrl?: string;
  currentOrderId?: string;
  occupiedAt?: string;
  guestCount?: number;
}

export interface TableListResponse {
  tables: Table[];
}

export interface SectionListResponse {
  sections: Section[];
}

/**
 * Tables API service
 */
export const tablesApi = {
  // Sections
  listSections: async (params?: { isActive?: boolean }): Promise<SectionListResponse> => {
    try {
      const response = await apiClient.get<SectionListResponse>('/sections', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  getSection: async (id: string): Promise<{ section: Section }> => {
    try {
      const response = await apiClient.get<{ section: Section }>(`/sections/${id}`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  createSection: async (data: Partial<Section>): Promise<{ section: Section }> => {
    try {
      const response = await apiClient.post<{ section: Section }>('/sections', data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  updateSection: async (id: string, data: Partial<Section>): Promise<{ section: Section }> => {
    try {
      const response = await apiClient.put<{ section: Section }>(`/sections/${id}`, data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  deleteSection: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/sections/${id}`);
    } catch (error) {
      throw getApiError(error);
    }
  },

  reorderSections: async (sectionIds: string[]): Promise<void> => {
    try {
      await apiClient.put('/sections/reorder', { sectionIds });
    } catch (error) {
      throw getApiError(error);
    }
  },

  // Tables
  listTables: async (params?: {
    sectionId?: string;
    status?: string;
  }): Promise<TableListResponse> => {
    try {
      const response = await apiClient.get<TableListResponse>('/tables', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  getTable: async (id: string): Promise<{ table: Table }> => {
    try {
      const response = await apiClient.get<{ table: Table }>(`/tables/${id}`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  createTable: async (data: Partial<Table>): Promise<{ table: Table }> => {
    try {
      const response = await apiClient.post<{ table: Table }>('/tables', data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  updateTable: async (id: string, data: Partial<Table>): Promise<{ table: Table }> => {
    try {
      const response = await apiClient.put<{ table: Table }>(`/tables/${id}`, data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  deleteTable: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/tables/${id}`);
    } catch (error) {
      throw getApiError(error);
    }
  },

  updateTableStatus: async (id: string, status: Table['status'], guestCount?: number): Promise<{ table: Table }> => {
    try {
      const response = await apiClient.put<{ table: Table }>(`/tables/${id}/status`, { status, guestCount });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  getTableQrCode: async (id: string): Promise<{ qrCodeUrl: string; externalToken: string }> => {
    try {
      const response = await apiClient.get<{ qrCodeUrl: string; externalToken: string }>(`/tables/${id}/qr-code`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },
};

