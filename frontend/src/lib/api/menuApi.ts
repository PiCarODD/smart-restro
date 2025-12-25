import apiClient, { getApiError } from './client';

export interface MenuCategory {
  id: string;
  restaurantId: string;
  parentId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  color?: string;
  icon?: string;
  isActive: boolean;
  availableStartTime?: string;
  availableEndTime?: string;
  availableDays?: number[];
  kdsStation?: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  costPrice?: number;
  variants?: Array<{ name: string; price: number }>;
  modifiers?: Array<{ name: string; price: number }>;
  imageUrl?: string;
  images?: string[];
  calories?: number;
  allergens?: string[];
  dietaryTags?: string[];
  displayOrder: number;
  isFeatured: boolean;
  isNew: boolean;
  isActive: boolean;
  isAvailable: boolean;
  availableStartTime?: string;
  availableEndTime?: string;
  availableDays?: number[];
  prepTimeMinutes?: number;
  kdsStation?: string;
  trackInventory: boolean;
}

export interface MenuItemListResponse {
  items: MenuItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CategoryListResponse {
  categories: MenuCategory[];
}

/**
 * Menu API service
 */
export const menuApi = {
  // Categories
  listCategories: async (params?: {
    parentId?: string;
    isActive?: boolean;
  }): Promise<CategoryListResponse> => {
    try {
      const response = await apiClient.get<CategoryListResponse>('/menu/categories', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  getCategory: async (id: string): Promise<{ category: MenuCategory }> => {
    try {
      const response = await apiClient.get<{ category: MenuCategory }>(`/menu/categories/${id}`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  createCategory: async (data: Partial<MenuCategory>): Promise<{ category: MenuCategory }> => {
    try {
      const response = await apiClient.post<{ category: MenuCategory }>('/menu/categories', data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  updateCategory: async (id: string, data: Partial<MenuCategory>): Promise<{ category: MenuCategory }> => {
    try {
      const response = await apiClient.put<{ category: MenuCategory }>(`/menu/categories/${id}`, data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  deleteCategory: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/menu/categories/${id}`);
    } catch (error) {
      throw getApiError(error);
    }
  },

  reorderCategories: async (categoryIds: string[]): Promise<void> => {
    try {
      await apiClient.put('/menu/categories/reorder', { categoryIds });
    } catch (error) {
      throw getApiError(error);
    }
  },

  // Menu Items
  listItems: async (params?: {
    categoryId?: string;
    isActive?: boolean;
    isAvailable?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<MenuItemListResponse> => {
    try {
      const response = await apiClient.get<MenuItemListResponse>('/menu/items', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  getItem: async (id: string): Promise<{ item: MenuItem }> => {
    try {
      const response = await apiClient.get<{ item: MenuItem }>(`/menu/items/${id}`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  createItem: async (data: Partial<MenuItem>): Promise<{ item: MenuItem }> => {
    try {
      const response = await apiClient.post<{ item: MenuItem }>('/menu/items', data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  updateItem: async (id: string, data: Partial<MenuItem>): Promise<{ item: MenuItem }> => {
    try {
      const response = await apiClient.put<{ item: MenuItem }>(`/menu/items/${id}`, data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  deleteItem: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/menu/items/${id}`);
    } catch (error) {
      throw getApiError(error);
    }
  },

  toggleAvailability: async (id: string, isAvailable: boolean): Promise<{ item: MenuItem }> => {
    try {
      const response = await apiClient.put<{ item: MenuItem }>(`/menu/items/${id}/availability`, {
        isAvailable,
      });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  uploadItemImage: async (id: string, imageFile: File): Promise<{ imageUrl: string; images: string[] }> => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await apiClient.put<{ imageUrl: string; images: string[] }>(
        `/menu/items/${id}/image`,
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

  uploadImage: async (imageFile: File): Promise<{ imageUrl: string; filename: string }> => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await apiClient.post<{ imageUrl: string; filename: string }>(
        '/upload/image',
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

