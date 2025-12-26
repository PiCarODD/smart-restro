import { create } from 'zustand';
import { Restaurant } from '@/types';
import { restaurantApi } from '@/lib/api';

interface RestaurantStore {
  restaurant: Restaurant | null;
  isLoading: boolean;
  
  loadRestaurant: () => Promise<void>;
  updateSettings: (settings: Partial<Restaurant['settings']>) => void;
}

export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
  restaurant: null,
  isLoading: false,

  loadRestaurant: async () => {
    const current = get().restaurant;
    // Don't reload if already loaded (to prevent unnecessary API calls)
    if (current && !get().isLoading) {
      return;
    }

    set({ isLoading: true });
    
    try {
      // No restaurant ID needed - backend extracts from JWT token
      const response = await restaurantApi.getById();
      
      // Map API restaurant to app Restaurant type
      const apiRestaurant = response.restaurant;
      const restaurant: Restaurant = {
        id: apiRestaurant.id,
        name: apiRestaurant.name,
        address: [
          apiRestaurant.addressLine1,
          apiRestaurant.addressLine2,
          apiRestaurant.city,
          apiRestaurant.state,
          apiRestaurant.postalCode,
          apiRestaurant.country,
        ].filter(Boolean).join(', '),
        phone: apiRestaurant.phone || '',
        logo: apiRestaurant.logoUrl || undefined,
        settings: {
          features: {
            kds: { enabled: true },
            waiterApp: { enabled: true },
            inventory: { enabled: true, autoDeduction: false },
            reservations: { enabled: false },
          },
          operations: {
            taxRate: 0,
            currency: apiRestaurant.currency || 'MMK',
          },
        },
      };

      set({ 
        restaurant, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to load restaurant:', error);
      set({ isLoading: false });
      // Don't throw - allow app to continue
    }
  },

  updateSettings: (newSettings) => {
    const current = get().restaurant;
    if (current) {
      set({
        restaurant: {
          ...current,
          settings: {
            ...current.settings,
            ...newSettings,
          },
        },
      });
    }
  },
}));

