import apiClient, { getApiError } from './client';

export interface IngredientCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Ingredient {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  category?: string;
  unit: string;
  unitCost: number;
  currentStock: number;
  minimumStock: number;
  maximumStock?: number;
  reorderQuantity?: number;
  supplierName?: string;
  supplierSku?: string;
  storageLocation?: string;
  storageTemp?: string;
  shelfLifeDays?: number;
  isActive: boolean;
  isLowStock?: boolean;
}

export interface RecipeIngredient {
  id: string;
  ingredientId: string;
  ingredient: {
    id: string;
    name: string;
    unit: string;
    unitCost: number;
  };
  quantity: number;
  unit: string;
  variantName?: string;
  wasteFactor?: number;
  notes?: string;
}

export interface Recipe {
  menuItemId: string;
  recipe: RecipeIngredient[];
}

export interface InventoryTransaction {
  id: string;
  ingredientId: string;
  type: 'purchase' | 'adjustment' | 'order_deduction' | 'waste' | 'transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost?: number;
  reason?: string;
  reference?: string;
  createdAt: string;
}

/**
 * Inventory API service
 */
export const inventoryApi = {
  // Ingredient Categories
  listCategories: async (): Promise<{ categories: IngredientCategory[] }> => {
    try {
      const response = await apiClient.get<{ categories: IngredientCategory[] }>('/inventory/categories');
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  getCategory: async (id: string): Promise<{ category: IngredientCategory }> => {
    try {
      const response = await apiClient.get<{ category: IngredientCategory }>(`/inventory/categories/${id}`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  createCategory: async (data: Omit<IngredientCategory, 'id'>): Promise<{ category: IngredientCategory }> => {
    try {
      const response = await apiClient.post<{ category: IngredientCategory }>('/inventory/categories', data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  updateCategory: async (id: string, data: Partial<IngredientCategory>): Promise<{ category: IngredientCategory }> => {
    try {
      const response = await apiClient.put<{ category: IngredientCategory }>(`/inventory/categories/${id}`, data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  deleteCategory: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/inventory/categories/${id}`);
    } catch (error) {
      throw getApiError(error);
    }
  },

  // Ingredients
  listIngredients: async (params?: {
    categoryId?: string;
    category?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<{ ingredients: Ingredient[] }> => {
    try {
      const response = await apiClient.get<{ ingredients: Ingredient[] }>('/inventory/ingredients', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  getIngredient: async (id: string): Promise<{ ingredient: Ingredient }> => {
    try {
      const response = await apiClient.get<{ ingredient: Ingredient }>(`/inventory/ingredients/${id}`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  createIngredient: async (data: Omit<Ingredient, 'id' | 'isLowStock'>): Promise<{ ingredient: Ingredient }> => {
    try {
      const response = await apiClient.post<{ ingredient: Ingredient }>('/inventory/ingredients', data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  updateIngredient: async (id: string, data: Partial<Ingredient>): Promise<{ ingredient: Ingredient }> => {
    try {
      const response = await apiClient.put<{ ingredient: Ingredient }>(`/inventory/ingredients/${id}`, data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  deleteIngredient: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/inventory/ingredients/${id}`);
    } catch (error) {
      throw getApiError(error);
    }
  },

  adjustStock: async (id: string, data: {
    quantity: number;
    type: 'add' | 'remove' | 'set';
    reason?: string;
  }): Promise<{ ingredient: Ingredient }> => {
    try {
      const response = await apiClient.put<{ ingredient: Ingredient }>(`/inventory/ingredients/${id}/stock`, data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  // Stock Operations
  getLowStock: async (): Promise<{ ingredients: Ingredient[] }> => {
    try {
      const response = await apiClient.get<{ ingredients: Ingredient[] }>('/inventory/low-stock');
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  stockTake: async (data: Array<{
    ingredientId: string;
    quantity: number;
  }>): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/inventory/stock-take', { items: data });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  getTransactions: async (params?: {
    ingredientId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: InventoryTransaction[]; pagination: any }> => {
    try {
      const response = await apiClient.get<{ transactions: InventoryTransaction[]; pagination: any }>('/inventory/transactions', { params });
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  // Recipes
  getRecipe: async (menuItemId: string): Promise<Recipe> => {
    try {
      const response = await apiClient.get<Recipe>(`/recipes/${menuItemId}`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  updateRecipe: async (menuItemId: string, data: {
    ingredients: Array<{
      ingredientId: string;
      quantity: number;
      unit: string;
      variantName?: string;
      wasteFactor?: number;
      notes?: string;
    }>;
  }): Promise<{ message: string }> => {
    try {
      const response = await apiClient.put<{ message: string }>(`/recipes/${menuItemId}`, data);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },

  deleteRecipe: async (menuItemId: string): Promise<void> => {
    try {
      await apiClient.delete(`/recipes/${menuItemId}`);
    } catch (error) {
      throw getApiError(error);
    }
  },

  calculateRecipeCost: async (menuItemId: string): Promise<{ cost: number }> => {
    try {
      const response = await apiClient.get<{ cost: number }>(`/recipes/${menuItemId}/cost`);
      return response.data;
    } catch (error) {
      throw getApiError(error);
    }
  },
};

