import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Search, MoreHorizontal, Ban, Check, FlaskConical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useInventoryStore } from '@/store/inventoryStore';
import { MenuItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { MenuItemDialog } from '@/components/features/menu/MenuItemDialog';
import { RecipeBuilder } from '@/components/features/inventory/RecipeBuilder';

export function MenuItemsPage() {
  const { t } = useTranslation();
  const { 
    categories, 
    menuItems, 
    loadCategories, 
    loadMenuItems, 
    deleteMenuItem, 
    toggleItemAvailability,
    isLoading,
    error,
    clearError
  } = useMenuStore();
  
  const { getRecipeByMenuItemIdSync, loadRecipes } = useInventoryStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const [recipeItem, setRecipeItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const loadData = async () => {
      await loadCategories();
      await loadMenuItems();
      await loadRecipes();
    };
    loadData();
  }, []);

  const openRecipeDialog = (item: MenuItem) => {
    setRecipeItem(item);
    setIsRecipeDialogOpen(true);
  };

  const hasRecipe = (itemId: string) => {
    // Use synchronous method for render-time checks
    const recipe = getRecipeByMenuItemIdSync(itemId);
    return recipe && recipe.ingredients && recipe.ingredients.length > 0;
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || t('menu.unknown');
  };

  const getCategoryIcon = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.icon || '🍽️';
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (item: MenuItem) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingItem) {
      try {
        await deleteMenuItem(deletingItem.id);
        setIsDeleteDialogOpen(false);
        setDeletingItem(null);
      } catch (error) {
        console.error('Failed to delete menu item:', error);
      }
    }
  };

  if (isLoading && menuItems.length === 0) {
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
          <h1 className="text-3xl font-bold">{t('menu.items')}</h1>
          <p className="text-muted-foreground">Manage your restaurant's menu items</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t('menu.addItem')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('menu.searchMenuItems')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('menu.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('menu.allCategories')}</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.icon} {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredItems.map((item) => (
          <Card 
            key={item.id} 
            className={`overflow-hidden ${!item.isAvailable ? 'opacity-60' : ''}`}
          >
            {/* Item Image */}
            <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
              {item.image ? (
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl">{getCategoryIcon(item.categoryId)}</span>
              )}
              {!item.isAvailable && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant="destructive" className="text-sm">
                    <Ban className="mr-1 h-3 w-3" />
                    {t('common.inactive')}
                  </Badge>
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getCategoryName(item.categoryId)}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(item)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {t('common.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openRecipeDialog(item)}>
                      <FlaskConical className="mr-2 h-4 w-4" />
                      {t('menu.recipeBuilder')}
                      {hasRecipe(item.id) && (
                        <Badge variant="secondary" className="ml-2 h-5 px-1.5">✓</Badge>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => {
                      try {
                        await toggleItemAvailability(item.id, !item.isAvailable);
                      } catch (error) {
                        console.error('Failed to toggle availability:', error);
                      }
                    }}>
                      {item.isAvailable ? (
                        <>
                          <Ban className="mr-2 h-4 w-4" />
                          {t('menu.disableItem')}
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          {t('menu.enableItem')}
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => openDeleteDialog(item)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {item.description || t('menu.noDescription')}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">
                  {formatCurrency(item.basePrice)}
                </span>
                <div className="flex gap-1">
                  {hasRecipe(item.id) && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      <FlaskConical className="h-3 w-3 mr-1" />
                      Recipe
                    </Badge>
                  )}
                  {item.variants.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {item.variants.length} sizes
                    </Badge>
                  )}
                  {item.modifiers.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {item.modifiers.length} add-ons
                    </Badge>
                  )}
                </div>
              </div>

              {/* Dietary Tags */}
              {item.dietaryTags && item.dietaryTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.dietaryTags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCategory !== 'all'
              ? t('menu.noItemsFound')
              : t('menu.noItemsFound')}
          </p>
          {!searchQuery && selectedCategory === 'all' && (
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              {t('menu.createFirstItem')}
            </Button>
          )}
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <MenuItemDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingItem={editingItem}
        categories={categories}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('menu.deleteItem')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('menu.deleteItemConfirm', { name: deletingItem?.name || '' })}
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

      {/* Recipe Builder Dialog */}
      <RecipeBuilder
        open={isRecipeDialogOpen}
        onOpenChange={setIsRecipeDialogOpen}
        menuItem={recipeItem}
      />
    </div>
  );
}

