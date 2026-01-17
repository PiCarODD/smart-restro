import { create } from 'zustand';
import { Restaurant } from '@/types';
import { restaurantApi } from '@/lib/api';
import { useAuthStore } from './authStore';

interface RestaurantStore {
  restaurant: Restaurant | null;
  isLoading: boolean;

  needsOnboarding: boolean;

  loadRestaurant: () => Promise<void>;
  createRestaurant: (data: any) => Promise<any>;
  updateSettings: (settings: Partial<Restaurant['settings']>) => void;
}

export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
  restaurant: null,
  isLoading: false,

  needsOnboarding: false,
  loadRestaurant: async () => {
    const current = get().restaurant;
    // Don't reload if already loaded (to prevent unnecessary API calls)
    if (current && !get().isLoading) {
      return;
    }

    set({ isLoading: true, needsOnboarding: false });

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
        isLoading: false,
        needsOnboarding: false
      });
    } catch (error: any) {
      console.error('Failed to load restaurant:', error);

      // Check for 404 (Not Found) which indicates no restaurant assigned/created
      if (error?.status === 404 || error?.message?.includes('404')) {
        set({ needsOnboarding: true });
      }

      set({ isLoading: false });
    }
  },

  createRestaurant: async (data: any) => {
    set({ isLoading: true });
    try {
      const response = await restaurantApi.create(data);
      // Wait a bit then reload restaurant
      await get().loadRestaurant();
      // Also refresh the user state to get the new restaurantId
      await useAuthStore.getState().checkAuth();

      set({ isLoading: false, needsOnboarding: false });
      return response.restaurant;
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
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

