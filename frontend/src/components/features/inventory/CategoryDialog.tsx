import { useEffect, useState } from 'react';
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
import { useInventoryStore, InventoryCategory } from '@/store/inventoryStore';
import { cn } from '@/lib/utils';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().min(1, 'Color is required'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: InventoryCategory | null;
}

const colorOptions = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#78716c'];

export function CategoryDialog({ open, onOpenChange, editingCategory }: CategoryDialogProps) {
  const { addCategory, updateCategory } = useInventoryStore();
  const [selectedColor, setSelectedColor] = useState('#3b82f6');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      color: '#3b82f6',
    },
  });

  const watchName = watch('name');

  useEffect(() => {
    if (open) {
      if (editingCategory) {
        reset({
          name: editingCategory.name,
          color: editingCategory.color,
        });
        setSelectedColor(editingCategory.color);
      } else {
        reset({
          name: '',
          color: '#3b82f6',
        });
        setSelectedColor('#3b82f6');
      }
    }
  }, [open, editingCategory, reset]);

  const onSubmit = (data: CategoryFormData) => {
    const categoryData = {
      name: data.name,
      icon: '', // No icon
      color: selectedColor,
    };

    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData);
    } else {
      addCategory(categoryData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? 'Edit Category' : 'Add Category'}
          </DialogTitle>
          <DialogDescription>
            {editingCategory 
              ? 'Update inventory category details' 
              : 'Create a new category for organizing ingredients'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Proteins, Vegetables, Spices"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-6 gap-2">
              {colorOptions.map(color => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "h-10 w-full rounded-lg transition-all",
                    selectedColor === color && "ring-2 ring-offset-2 ring-primary"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="font-medium">{watchName || 'Category Name'}</span>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingCategory ? 'Update' : 'Add'} Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

