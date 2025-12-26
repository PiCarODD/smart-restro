import apiClient, { getApiError } from './client';

export interface DailySales {
  date: string;
  dayName: string;
  dayShort: string;
  revenue: number;
  orders: number;
  avgOrder: number;
  tips: number;
  tax?: number;
  discount?: number;
  total?: number;
}

export interface HourlySales {
  hour: string;
  sales: number;
  orders: number;
}

export interface CategoryBreakdown {
  id: string;
  name: string;
  value: number;
  color: string;
  orders: number;
  quantity: number;
}

export interface TopSellingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  trend: number;
}

export interface StaffPerformance {
  id: string;
  name: string;
  role: string;
  orders: number;
  revenue: number;
  tips: number;
  avgTime: number;
  rating: number;
}

export interface PaymentMethod {
  method: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface InventoryUsage {
  id: string;
  name: string;
  used: number;
  unit: string;
  cost: number;
  reorderNeeded: boolean;
}

export interface SummaryStats {
  revenue: number;
  orders: number;
  avgOrder: number;
  tips: number;
  tax: number;
  discount: number;
  total: number;
}

/**
 * Reports API service
 */
export const reportsApi = {
  /**
   * Get daily sales report
   */
  getDailySales: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ sales: DailySales[] }> => {
    try {
      const response = await apiClient.get<{ sales: DailySales[] }>('/reports/sales/daily', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Get hourly sales report
   */
  getHourlySales: async (params?: {
    date?: string;
  }): Promise<{ sales: HourlySales[] }> => {
    try {
      const response = await apiClient.get<{ sales: HourlySales[] }>('/reports/sales/hourly', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Get sales by category
   */
  getSalesByCategory: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ categories: CategoryBreakdown[] }> => {
    try {
      const response = await apiClient.get<{ categories: CategoryBreakdown[] }>('/reports/sales/by-category', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Get top selling items
   */
  getTopSellingItems: async (params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<{ items: TopSellingItem[] }> => {
    try {
      const response = await apiClient.get<{ items: TopSellingItem[] }>('/reports/sales/by-item', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Get staff performance
   */
  getStaffPerformance: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ staff: StaffPerformance[] }> => {
    try {
      const response = await apiClient.get<{ staff: StaffPerformance[] }>('/reports/staff/performance', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Get payment methods breakdown
   */
  getPaymentMethods: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ methods: PaymentMethod[] }> => {
    try {
      const response = await apiClient.get<{ methods: PaymentMethod[] }>('/reports/payments/by-method', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Get inventory usage report
   */
  getInventoryUsage: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ usage: InventoryUsage[] }> => {
    try {
      const response = await apiClient.get<{ usage: InventoryUsage[] }>('/reports/inventory/usage', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  /**
   * Get summary statistics
   */
  getSummary: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ stats: SummaryStats }> => {
    try {
      const response = await apiClient.get<{ stats: SummaryStats }>('/reports/summary', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },
};

