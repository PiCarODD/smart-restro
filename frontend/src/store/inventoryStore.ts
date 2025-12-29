import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Ingredient, Recipe, RecipeIngredient } from '@/types';
import { inventoryApi, getApiError } from '@/lib/api';
import type { 
  Ingredient as ApiIngredient, 
  RecipeIngredient as ApiRecipeIngredient,
  Recipe as ApiRecipe
} from '@/lib/api/inventoryApi';

interface StockAdjustment {
  id: string;
  ingredientId: string;
  ingredientName: string;
  type: 'add' | 'remove' | 'adjustment' | 'order_deduction';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  createdAt: Date;
}

export interface InventoryCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  itemCount: number;
}

interface InventoryStore {
  ingredients: Ingredient[];
  recipes: Recipe[];
  categories: InventoryCategory[];
  stockHistory: StockAdjustment[];
  isLoading: boolean;
  error: string | null;

  // Categories
  loadCategories: () => Promise<void>;
  addCategory: (category: Omit<InventoryCategory, 'id' | 'itemCount'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<InventoryCategory>) => Promise<void>;
  deleteCategory: (id: string, moveToCategory?: string) => Promise<void>;
  getCategoryNames: () => string[];

  // Ingredients
  loadIngredients: () => Promise<void>;
  getIngredientById: (id: string) => Ingredient | undefined;
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'isLowStock'>) => Promise<void>;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;

  // Stock Management
  adjustStock: (ingredientId: string, quantity: number, type: StockAdjustment['type'], reason?: string) => Promise<void>;
  deductStockForOrder: (items: { menuItemId: string; quantity: number }[]) => Promise<void>;
  getLowStockIngredients: () => Ingredient[];

  // Recipes
  loadRecipes: () => Promise<void>;
  getRecipeByMenuItemId: (menuItemId: string) => Promise<Recipe | undefined>;
  getRecipeByMenuItemIdSync: (menuItemId: string) => Recipe | undefined; // Synchronous version for render
  saveRecipe: (menuItemId: string, ingredients: RecipeIngredient[]) => Promise<void>;
  deleteRecipe: (menuItemId: string) => Promise<void>;
  calculateRecipeCost: (ingredients: RecipeIngredient[]) => number;
  
  // Helpers
  clearError: () => void;
}

/**
 * Map API Ingredient to Frontend Ingredient
 */
function mapApiIngredientToIngredient(apiIng: ApiIngredient): Ingredient {
  return {
    id: apiIng.id,
    name: apiIng.name,
    category: apiIng.category || apiIng.categoryId || '',
    unit: apiIng.unit,
    unitCost: apiIng.unitCost,
    currentStock: apiIng.currentStock,
    minimumStock: apiIng.minimumStock,
    isLowStock: apiIng.isLowStock || apiIng.currentStock <= apiIng.minimumStock,
  };
}

/**
 * Map API RecipeIngredient to Frontend RecipeIngredient
 */
function mapApiRecipeIngredientToRecipeIngredient(apiRi: ApiRecipeIngredient): RecipeIngredient {
  return {
    ingredientId: apiRi.ingredientId,
    ingredientName: apiRi.ingredient.name,
    quantity: apiRi.quantity,
    unit: apiRi.unit,
    cost: apiRi.ingredient.unitCost * apiRi.quantity, // Calculate cost
    variantName: apiRi.variantName || undefined,
  };
}

/**
 * Map API Recipe to Frontend Recipe
 */
function mapApiRecipeToRecipe(apiRecipe: ApiRecipe): Recipe {
  const ingredients = apiRecipe.recipe.map(mapApiRecipeIngredientToRecipeIngredient);
  const totalCost = ingredients.reduce((sum, ri) => sum + ri.cost, 0);
  
  return {
    menuItemId: apiRecipe.menuItemId,
    ingredients,
    totalCost,
  };
}

/**
 * Map Frontend Ingredient to API format
 */
function mapIngredientToApiFormat(ing: Omit<Ingredient, 'id' | 'isLowStock'>): Partial<ApiIngredient> {
  return {
    name: ing.name,
    category: ing.category,
    unit: ing.unit,
    unitCost: ing.unitCost,
    currentStock: ing.currentStock,
    minimumStock: ing.minimumStock,
    isActive: true,
  };
}

/**
 * Map Frontend RecipeIngredient to API format
 */
function mapRecipeIngredientToApiFormat(ri: RecipeIngredient): {
  ingredientId: string;
  quantity: number;
  unit: string;
  variantName?: string;
  wasteFactor?: number;
  notes?: string;
} {
  return {
    ingredientId: ri.ingredientId,
    quantity: ri.quantity,
    unit: ri.unit,
    variantName: ri.variantName,
  };
}

export const useInventoryStore = create<InventoryStore>()(
  persist(
    (set, get) => ({
      ingredients: [],
      recipes: [],
      categories: [],
      stockHistory: [],
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      // Category Management
      loadCategories: async () => {
        set({ error: null });
        try {
          const response = await inventoryApi.listCategories();
          
          // Map API categories to frontend categories
          // Note: API categories may not have icon/color, so we'll use defaults
          const ingredients = get().ingredients;
          const categories: InventoryCategory[] = response.categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: (cat as any).icon || '📦', // Default icon if not in API
            color: (cat as any).color || '#6b7280', // Default color
            itemCount: ingredients.filter(ing => ing.category === cat.name || ing.category === cat.id).length,
          }));
          
          set({ categories });
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message });
          throw error;
        }
      },

      addCategory: async (categoryData) => {
        set({ error: null });
        try {
          const response = await inventoryApi.createCategory({
            name: categoryData.name,
            description: categoryData.name,
            icon: categoryData.icon,
            color: categoryData.color,
            displayOrder: 0,
            isActive: true,
          });
          
          const newCategory: InventoryCategory = {
            id: response.category.id,
            name: response.category.name,
            icon: categoryData.icon || '📦',
            color: categoryData.color || '#6b7280',
            itemCount: 0,
          };
          
          set(state => ({
            categories: [...state.categories, newCategory],
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
          await inventoryApi.updateCategory(id, {
            name: updates.name,
            icon: updates.icon,
            color: updates.color,
          } as any);
          
          const oldCategory = get().categories.find(c => c.id === id);
          set(state => ({
            categories: state.categories.map(cat =>
              cat.id === id ? { ...cat, ...updates } : cat
            ),
            // If name changed, update all ingredients with old category name
            ingredients: updates.name && oldCategory
              ? state.ingredients.map(ing =>
                  ing.category === oldCategory.name
                    ? { ...ing, category: updates.name! }
                    : ing
                )
              : state.ingredients,
          }));
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message });
          throw error;
        }
      },

      deleteCategory: async (id, moveToCategory) => {
        set({ error: null });
        try {
          await inventoryApi.deleteCategory(id);
          
          const category = get().categories.find(c => c.id === id);
          if (!category) return;

          set(state => ({
            categories: state.categories.filter(c => c.id !== id),
            // Move ingredients to another category or leave as-is
            ingredients: moveToCategory
              ? state.ingredients.map(ing =>
                  ing.category === category.name
                    ? { ...ing, category: moveToCategory }
                    : ing
                )
              : state.ingredients,
          }));
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message });
          throw error;
        }
      },

      getCategoryNames: () => {
        return get().categories.map(c => c.name);
      },

      loadIngredients: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await inventoryApi.listIngredients({});
          
          const ingredients = response.ingredients.map(mapApiIngredientToIngredient);
          set({ ingredients, isLoading: false });
          
          // Reload categories to update item counts
          await get().loadCategories();
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message, isLoading: false });
          throw error;
        }
      },

      getIngredientById: (id) => {
        return get().ingredients.find(ing => ing.id === id);
      },

      addIngredient: async (ingredientData) => {
        set({ error: null });
        try {
          const apiData = mapIngredientToApiFormat(ingredientData);
          const response = await inventoryApi.createIngredient(apiData as any);
          
          const newIngredient = mapApiIngredientToIngredient(response.ingredient);
          
          set(state => ({
            ingredients: [...state.ingredients, newIngredient],
          }));
          
          // Reload categories to update item counts
          await get().loadCategories();
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message });
          throw error;
        }
      },

      updateIngredient: async (id, updates) => {
        set({ error: null });
        try {
          const apiData = mapIngredientToApiFormat(updates as any);
          const response = await inventoryApi.updateIngredient(id, apiData);
          
          const updatedIngredient = mapApiIngredientToIngredient(response.ingredient);
          
          set(state => ({
            ingredients: state.ingredients.map(ing =>
              ing.id === id ? updatedIngredient : ing
            ),
          }));
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message });
          throw error;
        }
      },

      deleteIngredient: async (id) => {
        set({ error: null });
        try {
          await inventoryApi.deleteIngredient(id);
          
          set(state => ({
            ingredients: state.ingredients.filter(ing => ing.id !== id),
            // Also remove from any recipes
            recipes: state.recipes.map(recipe => ({
              ...recipe,
              ingredients: recipe.ingredients.filter(ri => ri.ingredientId !== id),
            })),
          }));
          
          // Reload categories to update item counts
          await get().loadCategories();
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message });
          throw error;
        }
      },

      adjustStock: async (ingredientId, quantity, type, reason) => {
        set({ error: null });
        try {
          // Map type to API format
          const apiType = type === 'add' ? 'add' : type === 'remove' || type === 'order_deduction' ? 'remove' : 'set';
          
          const response = await inventoryApi.adjustStock(ingredientId, {
            quantity,
            type: apiType,
            reason,
          });
          
          const updatedIngredient = mapApiIngredientToIngredient(response.ingredient);
          const previousStock = get().getIngredientById(ingredientId)?.currentStock || 0;
          
          const adjustment: StockAdjustment = {
            id: `${Date.now()}-${Math.random()}`,
            ingredientId,
            ingredientName: updatedIngredient.name,
            type,
            quantity,
            previousStock,
            newStock: updatedIngredient.currentStock,
            reason,
            createdAt: new Date(),
          };
          
          set(state => ({
            ingredients: state.ingredients.map(ing =>
              ing.id === ingredientId ? updatedIngredient : ing
            ),
            stockHistory: [adjustment, ...state.stockHistory].slice(0, 100),
          }));
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message });
          throw error;
        }
      },

      deductStockForOrder: async (items) => {
        // This would typically be handled by the backend when order is completed
        // But we can still call adjustStock for each ingredient
        const recipes = get().recipes;
        
        for (const orderItem of items) {
          const recipe = recipes.find(r => r.menuItemId === orderItem.menuItemId);
          if (!recipe) continue;

          for (const recipeIng of recipe.ingredients) {
            const totalQuantity = recipeIng.quantity * orderItem.quantity;
            await get().adjustStock(
              recipeIng.ingredientId,
              totalQuantity,
              'order_deduction',
              `Order: ${orderItem.quantity}x item`
            );
          }
        }
      },

      getLowStockIngredients: () => {
        // Filter already loaded ingredients instead of making API call
        // This prevents infinite loops when called in component render
        return get().ingredients.filter(ing => ing.isLowStock);
      },

      loadRecipes: async () => {
        // Recipes are loaded per menu item when needed via getRecipeByMenuItemId
        // Don't clear existing recipes on page load - they're persisted in local storage
        // This allows recipes to persist across page refreshes
      },

      getRecipeByMenuItemId: async (menuItemId) => {
        // First check if recipe exists in local state
        const existingRecipe = get().recipes.find(r => r.menuItemId === menuItemId);
        if (existingRecipe) {
          return existingRecipe;
        }
        
        // If not found, fetch from API
        try {
          const apiRecipe = await inventoryApi.getRecipe(menuItemId);
          const recipe = mapApiRecipeToRecipe(apiRecipe);
          
          // Store it in state for future use
          set(state => {
            const existingIndex = state.recipes.findIndex(r => r.menuItemId === menuItemId);
            if (existingIndex >= 0) {
              const updated = [...state.recipes];
              updated[existingIndex] = recipe;
              return { recipes: updated };
            }
            return { recipes: [...state.recipes, recipe] };
          });
          
          return recipe;
        } catch (error) {
          // Recipe might not exist, return undefined
          return undefined;
        }
      },

      getRecipeByMenuItemIdSync: (menuItemId) => {
        // Synchronous version for use in render - only checks local state
        return get().recipes.find(r => r.menuItemId === menuItemId);
      },

      saveRecipe: async (menuItemId, ingredients) => {
        set({ error: null });
        try {
          await inventoryApi.updateRecipe(menuItemId, {
            ingredients: ingredients.map(mapRecipeIngredientToApiFormat),
          });
          
          const totalCost = get().calculateRecipeCost(ingredients);
          const newRecipe: Recipe = { menuItemId, ingredients, totalCost };
          
          set(state => {
            const existingIndex = state.recipes.findIndex(r => r.menuItemId === menuItemId);
            
            if (existingIndex >= 0) {
              const updated = [...state.recipes];
              updated[existingIndex] = newRecipe;
              return { recipes: updated };
            }
            
            return { recipes: [...state.recipes, newRecipe] };
          });
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message });
          throw error;
        }
      },

      deleteRecipe: async (menuItemId) => {
        set({ error: null });
        try {
          await inventoryApi.deleteRecipe(menuItemId);
          
          set(state => ({
            recipes: state.recipes.filter(r => r.menuItemId !== menuItemId),
          }));
        } catch (error) {
          const apiError = getApiError(error);
          set({ error: apiError.message });
          throw error;
        }
      },

      calculateRecipeCost: (ingredients) => {
        return ingredients.reduce((sum, ing) => sum + ing.cost, 0);
      },
    }),
    {
      name: 'inventory-storage',
      partialize: (state) => ({
        ingredients: state.ingredients,
        recipes: state.recipes,
        categories: state.categories,
        stockHistory: state.stockHistory,
      }),
    }
  )
);
