import { useState } from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInventoryStore, InventoryCategory } from '@/store/inventoryStore';
import { CategoryDialog } from './CategoryDialog';

export function CategoryManager() {
  const { categories, deleteCategory } = useInventoryStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<InventoryCategory | null>(null);
  const [moveToCategory, setMoveToCategory] = useState<string>('');

  const openCreateDialog = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: InventoryCategory) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (category: InventoryCategory) => {
    setDeletingCategory(category);
    setMoveToCategory('');
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (deletingCategory) {
      deleteCategory(deletingCategory.id, moveToCategory || undefined);
      setIsDeleteDialogOpen(false);
      setDeletingCategory(null);
    }
  };

  const otherCategories = categories.filter(c => c.id !== deletingCategory?.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categories.length} categories
        </p>
        <Button size="sm" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {categories.map(category => (
            <div
              key={category.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: category.color + '20' }}
              >
                {category.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-muted-foreground">
                  {category.itemCount} ingredient{category.itemCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEditDialog(category)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => openDeleteDialog(category)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {categories.length === 0 && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">No categories yet</p>
          <Button className="mt-4" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Category
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <CategoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingCategory={editingCategory}
      />

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Category {deletingCategory?.name || ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {deletingCategory && deletingCategory.itemCount > 0 && otherCategories.length > 0 && (
            <div className="py-4">
              <label className="text-sm font-medium">Move ingredients to:</label>
              <Select value={moveToCategory} onValueChange={setMoveToCategory}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {otherCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!moveToCategory && (
                <p className="text-xs text-muted-foreground mt-1">
                  If not selected, ingredients will keep their current category name.
                </p>
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

