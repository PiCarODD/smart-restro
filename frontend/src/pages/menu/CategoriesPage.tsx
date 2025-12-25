import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useMenuStore } from '@/store/menuStore';
import { MenuCategory } from '@/types';

type CategoryFormData = {
  name: string;
  description?: string;
  isActive: boolean;
};

export function CategoriesPage() {
  const { t } = useTranslation();
  const { categories, loadCategories, addCategory, updateCategory, deleteCategory, isLoading, error, clearError } = useMenuStore();

  const categorySchema = z.object({
    name: z.string().min(1, t('common.name') + ' is required'),
    description: z.string().optional(),
    isActive: z.boolean(),
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<MenuCategory | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateDialog = () => {
    setEditingCategory(null);
    reset({
      name: '',
      description: '',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: MenuCategory) => {
    setEditingCategory(category);
    reset({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (category: MenuCategory) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const categoryData = {
        ...data,
        icon: '', // No icon
        displayOrder: editingCategory?.displayOrder || categories.length + 1,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
      } else {
        await addCategory(categoryData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      // Error is handled by the store
      console.error('Failed to save category:', error);
    }
  };

  const handleDelete = async () => {
    if (deletingCategory) {
      try {
        await deleteCategory(deletingCategory.id);
        setIsDeleteDialogOpen(false);
        setDeletingCategory(null);
      } catch (error) {
        // Error is handled by the store
        console.error('Failed to delete category:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError}>×</Button>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('menu.categories')}</h1>
          <p className="text-muted-foreground">{t('menu.organizeIntoCategories')}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t('menu.addCategory')}
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className={!category.isActive ? 'opacity-60' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => openDeleteDialog(category)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {category.description || t('menu.noDescription')}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{category.itemCount} {t('common.items')}</span>
                <span className={category.isActive ? 'text-green-600' : 'text-red-600'}>
                  {category.isActive ? t('common.active') : t('common.inactive')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">{t('menu.noCategoriesYet')}</p>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t('menu.createFirstCategory')}
          </Button>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t('menu.editCategory') : t('menu.createCategory')}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? t('menu.updateCategoryDetails')
                : t('menu.addNewCategory')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('common.name')} *</Label>
              <Input
                id="name"
                placeholder="e.g., Main Course"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea
                id="description"
                placeholder={t('common.description')}
                {...register('description')}
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">{t('common.active')}</Label>
                <p className="text-sm text-muted-foreground">
                  Show this category in the menu
                </p>
              </div>
              <Switch
                id="isActive"
                {...register('isActive')}
                defaultChecked={editingCategory?.isActive ?? true}
                onCheckedChange={(checked) => setValue('isActive', checked)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {editingCategory ? t('profile.saveChanges') : t('menu.createCategory')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('menu.deleteCategory')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('menu.deleteCategoryConfirm', { name: deletingCategory?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

