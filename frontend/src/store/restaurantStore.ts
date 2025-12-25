import { create } from 'zustand';
import { Restaurant } from '@/types';
import { mockRestaurant } from '@/mock/data/users';

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
    set({ isLoading: true });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    set({ 
      restaurant: mockRestaurant, 
      isLoading: false 
    });
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

