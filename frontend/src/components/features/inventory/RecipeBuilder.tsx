import { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, Package, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useInventoryStore } from '@/store/inventoryStore';
import { MenuItem, RecipeIngredient } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';

interface RecipeBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem: MenuItem | null;
}

export function RecipeBuilder({ open, onOpenChange, menuItem }: RecipeBuilderProps) {
  const { t } = useTranslation();
  const { 
    ingredients, 
    loadIngredients,
    getRecipeByMenuItemId, 
    saveRecipe,
    calculateRecipeCost 
  } = useInventoryStore();

  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<string>('');

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  useEffect(() => {
    if (open && menuItem) {
      const loadRecipe = async () => {
        const existingRecipe = await getRecipeByMenuItemId(menuItem.id);
        if (existingRecipe && existingRecipe.ingredients) {
          setRecipeIngredients(existingRecipe.ingredients);
        } else {
          setRecipeIngredients([]);
        }
      };
      loadRecipe();
    }
  }, [open, menuItem, getRecipeByMenuItemId]);

  const addIngredient = () => {
    if (!selectedIngredient) return;
    
    const ingredient = ingredients.find(i => i.id === selectedIngredient);
    if (!ingredient) return;

    // Check if already added
    if (recipeIngredients.some(ri => ri.ingredientId === selectedIngredient)) {
      setSelectedIngredient('');
      return;
    }

    const newRecipeIngredient: RecipeIngredient = {
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      quantity: 0.1,
      unit: ingredient.unit,
      cost: ingredient.unitCost * 0.1,
    };

    setRecipeIngredients([...recipeIngredients, newRecipeIngredient]);
    setSelectedIngredient('');
  };

  const updateIngredientQuantity = (ingredientId: string, quantity: number) => {
    const ingredient = ingredients.find(i => i.id === ingredientId);
    if (!ingredient) return;

    setRecipeIngredients(prev => prev.map(ri => {
      if (ri.ingredientId === ingredientId) {
        return {
          ...ri,
          quantity,
          cost: ingredient.unitCost * quantity,
        };
      }
      return ri;
    }));
  };

  const removeIngredient = (ingredientId: string) => {
    setRecipeIngredients(prev => prev.filter(ri => ri.ingredientId !== ingredientId));
  };

  const handleSave = () => {
    if (!menuItem) return;
    saveRecipe(menuItem.id, recipeIngredients);
    onOpenChange(false);
  };

  if (!menuItem) return null;

  const totalCost = calculateRecipeCost(recipeIngredients);
  const profitMargin = menuItem.basePrice - totalCost;
  const profitPercent = menuItem.basePrice > 0 
    ? ((profitMargin / menuItem.basePrice) * 100).toFixed(1)
    : 0;

  // Get available ingredients (not already in recipe)
  const availableIngredients = ingredients.filter(
    i => !recipeIngredients.some(ri => ri.ingredientId === i.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Recipe Builder</DialogTitle>
          <DialogDescription>
            {menuItem.name} - Define ingredients for automatic stock deduction
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Left: Recipe Ingredients */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Recipe Ingredients</Label>
              <Badge variant="outline">
                {recipeIngredients.length} items
              </Badge>
            </div>

            {/* Add Ingredient */}
            <div className="flex gap-2">
              <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {availableIngredients.map(ing => (
                    <SelectItem key={ing.id} value={ing.id}>
                      <div className="flex items-center gap-2">
                        <span>{ing.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({ing.unit})
                        </span>
                        {ing.isLowStock && (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                size="icon" 
                onClick={addIngredient}
                disabled={!selectedIngredient}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Ingredients List */}
            <ScrollArea className="h-[300px] border rounded-lg p-2">
              {recipeIngredients.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No ingredients added yet</p>
                  <p className="text-xs">Add ingredients to define the recipe</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recipeIngredients.map(ri => {
                    const ingredient = ingredients.find(i => i.id === ri.ingredientId);
                    return (
                      <div 
                        key={ri.ingredientId}
                        className="flex items-center gap-2 p-2 rounded bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {ri.ingredientName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(ingredient?.unitCost || 0)}/{ri.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={ri.quantity}
                            onChange={(e) => updateIngredientQuantity(
                              ri.ingredientId, 
                              parseFloat(e.target.value) || 0
                            )}
                            className="w-20 h-8 text-sm"
                          />
                          <span className="text-xs text-muted-foreground w-8">
                            {ri.unit}
                          </span>
                        </div>
                        <span className="text-sm font-medium w-16 text-right">
                          {formatCurrency(ri.cost)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeIngredient(ri.ingredientId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right: Cost Summary */}
          <div className="space-y-4">
            <Label>{t('menu.costAnalysis')}</Label>
            
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('menu.sellingPrice')}</span>
                <span className="font-bold">{formatCurrency(menuItem.basePrice)}</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('menu.ingredientCost')}</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(totalCost)}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('menu.profit')}</span>
                <span className={cn(
                  "font-bold",
                  profitMargin >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(profitMargin)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('menu.profitMargin')}</span>
                <Badge 
                  variant="outline"
                  className={cn(
                    parseFloat(profitPercent as string) >= 50 
                      ? "bg-green-50 text-green-700 border-green-200"
                      : parseFloat(profitPercent as string) >= 30
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  )}
                >
                  {profitPercent}%
                </Badge>
              </div>
            </div>

            {/* Ingredient Breakdown */}
            <div className="space-y-2">
              <Label className="text-sm">{t('menu.costBreakdown')}</Label>
              <div className="space-y-1">
                {recipeIngredients.map(ri => {
                  const percentage = totalCost > 0 
                    ? ((ri.cost / totalCost) * 100).toFixed(0)
                    : 0;
                  return (
                    <div key={ri.ingredientId} className="flex items-center gap-2 text-xs">
                      <div 
                        className="h-2 bg-primary rounded"
                        style={{ width: `${percentage}%`, minWidth: '4px' }}
                      />
                      <span className="text-muted-foreground flex-1 truncate">
                        {ri.ingredientName}
                      </span>
                      <span>{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tips */}
            <div className="p-3 bg-blue-50 rounded-lg text-sm">
              <p className="font-medium text-blue-700 mb-1">💡 Tips</p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• Target 60-70% profit margin for sustainability</li>
                <li>• Review recipes monthly for cost changes</li>
                <li>• Stock will auto-deduct when orders are placed</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <DollarSign className="mr-2 h-4 w-4" />
            Save Recipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

