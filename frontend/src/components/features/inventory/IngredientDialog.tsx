import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useInventoryStore } from '@/store/inventoryStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Ingredient } from '@/types';
import { unitOptions } from '@/mock/data/inventory';
import { getCurrencySymbol } from '@/lib/utils';

interface IngredientFormData {
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  currentStock: number;
  minimumStock: number;
}

const ingredientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  unit: z.string().min(1, 'Unit is required'),
  unitCost: z.coerce.number().min(0, 'Cost must be positive'),
  currentStock: z.coerce.number().min(0, 'Stock must be positive'),
  minimumStock: z.coerce.number().min(0, 'Minimum stock must be positive'),
});

interface IngredientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingIngredient: Ingredient | null;
}

export function IngredientDialog({ 
  open, 
  onOpenChange, 
  editingIngredient 
}: IngredientDialogProps) {
  const { addIngredient, updateIngredient, categories } = useInventoryStore();
  const { restaurantInfo } = useSettingsStore();
  const currencySymbol = getCurrencySymbol(restaurantInfo?.currency || 'MMK');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientSchema) as any,
    defaultValues: {
      name: '',
      category: '',
      unit: 'kg',
      unitCost: 0,
      currentStock: 0,
      minimumStock: 0,
    },
  });

  const category = watch('category');
  const unit = watch('unit');

  useEffect(() => {
    if (open) {
      if (editingIngredient) {
        reset({
          name: editingIngredient.name,
          category: editingIngredient.category,
          unit: editingIngredient.unit,
          unitCost: editingIngredient.unitCost,
          currentStock: editingIngredient.currentStock,
          minimumStock: editingIngredient.minimumStock,
        });
      } else {
        reset({
          name: '',
          category: '',
          unit: 'kg',
          unitCost: 0,
          currentStock: 0,
          minimumStock: 0,
        });
      }
    }
  }, [open, editingIngredient, reset]);

  const onSubmit = (data: IngredientFormData) => {
    if (editingIngredient) {
      updateIngredient(editingIngredient.id, data);
    } else {
      addIngredient(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
          </DialogTitle>
          <DialogDescription>
            {editingIngredient 
              ? 'Update ingredient details' 
              : 'Add a new ingredient to your inventory'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Chicken Breast"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select 
                value={category} 
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Unit *</Label>
              <Select 
                value={unit} 
                onValueChange={(value) => setValue('unit', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-destructive">{errors.unit.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitCost">Unit Cost ({currencySymbol}) *</Label>
            <Input
              id="unitCost"
              type="number"
              step="0.01"
              {...register('unitCost')}
              placeholder="0.00"
            />
            {errors.unitCost && (
              <p className="text-sm text-destructive">{errors.unitCost.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock">Current Stock *</Label>
              <Input
                id="currentStock"
                type="number"
                step="0.01"
                {...register('currentStock')}
                placeholder="0"
              />
              {errors.currentStock && (
                <p className="text-sm text-destructive">{errors.currentStock.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimumStock">Minimum Stock *</Label>
              <Input
                id="minimumStock"
                type="number"
                step="0.01"
                {...register('minimumStock')}
                placeholder="0"
              />
              {errors.minimumStock && (
                <p className="text-sm text-destructive">{errors.minimumStock.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingIngredient ? 'Update' : 'Add'} Ingredient
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

