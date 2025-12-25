import { create } from 'zustand';
import { MenuCategory, MenuItem } from '@/types';
import { menuApi, getApiError } from '@/lib/api';

interface MenuStore {
  categories: MenuCategory[];
  menuItems: MenuItem[];
  isLoading: boolean;
  error: string | null;
  
  // Categories
  loadCategories: () => Promise<void>;
  addCategory: (category: Omit<MenuCategory, 'id' | 'itemCount'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<MenuCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reorderCategories: (categoryIds: string[]) => Promise<void>;
  
  // Menu Items
  loadMenuItems: (filters?: {
    categoryId?: string;
    isActive?: boolean;
    isAvailable?: boolean;
    search?: string;
  }) => Promise<void>;
  getMenuItem: (id: string) => Promise<MenuItem | null>;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  toggleItemAvailability: (id: string, isAvailable: boolean) => Promise<void>;
  uploadItemImage: (id: string, imageFile: File) => Promise<void>;
  
  // Helpers
  clearError: () => void;
  getCategoryItemCount: (categoryId: string) => number;
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  categories: [],
  menuItems: [],
  isLoading: false,
  error: null,

  loadCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      // restaurantId removed - backend extracts from JWT token for security
      const response = await menuApi.listCategories({});
      
      // Map API categories to app MenuCategory type
      const categories: MenuCategory[] = response.categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
        itemCount: 0, // Will be calculated from menuItems
      }));
      
      set({ categories, isLoading: false });
      
      // Calculate item counts
      const items = get().menuItems;
      const categoriesWithCounts = categories.map(cat => ({
        ...cat,
        itemCount: items.filter(item => item.categoryId === cat.id).length,
      }));
      set({ categories: categoriesWithCounts });
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message, isLoading: false });
      throw error;
    }
  },

  addCategory: async (category) => {
    set({ error: null });
    try {
      // restaurantId removed - backend extracts from JWT token for security
      const response = await menuApi.createCategory({
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: (category as any).color, // API supports color but type doesn't
        displayOrder: category.displayOrder,
        isActive: category.isActive,
      });
      
      const newCategory: MenuCategory = {
        id: response.category.id,
        name: response.category.name,
        description: response.category.description,
        icon: response.category.icon,
        displayOrder: response.category.displayOrder,
        isActive: response.category.isActive,
        itemCount: 0,
      };
      
      set(state => ({
        categories: [...state.categories, newCategory].sort((a, b) => 
          a.displayOrder - b.displayOrder
        ),
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  updateCategory: async (id, updates) => {
    set({ error: null });
    try {
      const response = await menuApi.updateCategory(id, updates);
      
      const updatedCategory: MenuCategory = {
        id: response.category.id,
        name: response.category.name,
        description: response.category.description,
        icon: response.category.icon,
        displayOrder: response.category.displayOrder,
        isActive: response.category.isActive,
        itemCount: get().categories.find(c => c.id === id)?.itemCount || 0,
      };
      
      set(state => ({
        categories: state.categories.map(cat =>
          cat.id === id ? updatedCategory : cat
        ),
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    set({ error: null });
    try {
      await menuApi.deleteCategory(id);
      
      set(state => ({
        categories: state.categories.filter(cat => cat.id !== id),
        // Note: Backend will handle items in this category (prevent deletion if items exist)
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  reorderCategories: async (categoryIds) => {
    set({ error: null });
    try {
      await menuApi.reorderCategories(categoryIds);
      
      // Reload categories to get new order
      await get().loadCategories();
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  loadMenuItems: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      // restaurantId removed - backend extracts from JWT token for security
      const response = await menuApi.listItems({
        ...filters,
      });
      
      // Map API items to app MenuItem type
      const items: MenuItem[] = response.items.map(item => ({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        basePrice: parseFloat(item.basePrice.toString()),
        variants: item.variants || [],
        modifiers: item.modifiers || [],
        image: item.imageUrl, // Map imageUrl to image for frontend type
        isActive: item.isActive,
        isAvailable: item.isAvailable,
        allergens: item.allergens || [],
        dietaryTags: item.dietaryTags || [],
      }));
      
      set({ menuItems: items, isLoading: false });
      
      // Update category item counts
      const categories = get().categories.map(cat => ({
        ...cat,
        itemCount: items.filter(item => item.categoryId === cat.id).length,
      }));
      set({ categories });
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message, isLoading: false });
      throw error;
    }
  },

  getMenuItem: async (id: string) => {
    try {
      const response = await menuApi.getItem(id);
      
      const item: MenuItem = {
        id: response.item.id,
        categoryId: response.item.categoryId,
        name: response.item.name,
        description: response.item.description,
        basePrice: parseFloat(response.item.basePrice.toString()),
        variants: response.item.variants || [],
        modifiers: response.item.modifiers || [],
        image: response.item.imageUrl, // Map imageUrl to image
        isActive: response.item.isActive,
        isAvailable: response.item.isAvailable,
        allergens: response.item.allergens || [],
        dietaryTags: response.item.dietaryTags || [],
      };
      
      return item;
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      return null;
    }
  },

  addMenuItem: async (item) => {
    set({ error: null });
    try {
      const response = await menuApi.createItem({
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        basePrice: item.basePrice,
        variants: item.variants,
        modifiers: item.modifiers,
        imageUrl: item.image, // Map image to imageUrl for API
        allergens: item.allergens,
        dietaryTags: item.dietaryTags,
        isActive: item.isActive,
        isAvailable: item.isAvailable,
      });
      
      const newItem: MenuItem = {
        id: response.item.id,
        categoryId: response.item.categoryId,
        name: response.item.name,
        description: response.item.description,
        basePrice: parseFloat(response.item.basePrice.toString()),
        variants: response.item.variants || [],
        modifiers: response.item.modifiers || [],
        image: response.item.imageUrl, // Map imageUrl to image
        isActive: response.item.isActive,
        isAvailable: response.item.isAvailable,
        allergens: response.item.allergens || [],
        dietaryTags: response.item.dietaryTags || [],
      };
      
      set(state => {
        const updatedItems = [...state.menuItems, newItem];
        const categories = state.categories.map(cat =>
          cat.id === newItem.categoryId
            ? { ...cat, itemCount: cat.itemCount + 1 }
            : cat
        );
        return { menuItems: updatedItems, categories };
      });
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  updateMenuItem: async (id, updates) => {
    set({ error: null });
    try {
      // Map image field to imageUrl for API
      const apiUpdates = {
        ...updates,
        imageUrl: updates.image, // Map image to imageUrl
      };
      delete apiUpdates.image; // Remove image field
      
      const response = await menuApi.updateItem(id, apiUpdates);
      
      const updatedItem: MenuItem = {
        id: response.item.id,
        categoryId: response.item.categoryId,
        name: response.item.name,
        description: response.item.description,
        basePrice: parseFloat(response.item.basePrice.toString()),
        variants: response.item.variants || [],
        modifiers: response.item.modifiers || [],
        image: response.item.imageUrl, // Map imageUrl to image
        isActive: response.item.isActive,
        isAvailable: response.item.isAvailable,
        allergens: response.item.allergens || [],
        dietaryTags: response.item.dietaryTags || [],
      };
      
      set(state => {
        const oldItem = state.menuItems.find(item => item.id === id);
        let categories = state.categories;
        
        // If category changed, update counts
        if (oldItem && updatedItem.categoryId !== oldItem.categoryId) {
          categories = categories.map(cat => {
            if (cat.id === oldItem.categoryId) {
              return { ...cat, itemCount: Math.max(0, cat.itemCount - 1) };
            }
            if (cat.id === updatedItem.categoryId) {
              return { ...cat, itemCount: cat.itemCount + 1 };
            }
            return cat;
          });
        }
        
        return {
          menuItems: state.menuItems.map(item =>
            item.id === id ? updatedItem : item
          ),
          categories,
        };
      });
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  deleteMenuItem: async (id) => {
    set({ error: null });
    try {
      await menuApi.deleteItem(id);
      
      set(state => {
        const item = state.menuItems.find(i => i.id === id);
        const categories = item
          ? state.categories.map(cat =>
              cat.id === item.categoryId
                ? { ...cat, itemCount: Math.max(0, cat.itemCount - 1) }
                : cat
            )
          : state.categories;
        
        return {
          menuItems: state.menuItems.filter(i => i.id !== id),
          categories,
        };
      });
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  toggleItemAvailability: async (id, isAvailable) => {
    set({ error: null });
    try {
      const response = await menuApi.toggleAvailability(id, isAvailable);
      
      set(state => ({
        menuItems: state.menuItems.map(item =>
          item.id === id
            ? { ...item, isAvailable: response.item.isAvailable }
            : item
        ),
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  uploadItemImage: async (id, imageFile) => {
    set({ error: null });
    try {
      const response = await menuApi.uploadItemImage(id, imageFile);
      
      set(state => ({
        menuItems: state.menuItems.map(item =>
          item.id === id
            ? {
                ...item,
                image: response.imageUrl, // Map imageUrl to image
              }
            : item
        ),
      }));
    } catch (error) {
      const apiError = getApiError(error);
      set({ error: apiError.message });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  getCategoryItemCount: (categoryId: string) => {
    return get().menuItems.filter(item => item.categoryId === categoryId).length;
  },
}));
