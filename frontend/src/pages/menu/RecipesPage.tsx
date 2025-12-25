import { useEffect, useState } from 'react';
import { 
  FlaskConical, 
  Search, 
  AlertTriangle, 
  Package,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import { useMenuStore } from '@/store/menuStore';
import { useInventoryStore } from '@/store/inventoryStore';
import { MenuItem } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { RecipeBuilder } from '@/components/features/inventory/RecipeBuilder';

export function RecipesPage() {
  const { t } = useTranslation();
  const { menuItems, categories, loadMenuItems, loadCategories } = useMenuStore();
  const { ingredients, loadRecipes, loadIngredients, getRecipeByMenuItemIdSync, getRecipeByMenuItemId } = useInventoryStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const loadData = async () => {
      await loadMenuItems();
      await loadCategories();
      await loadIngredients();
      await loadRecipes();
    };
    
    loadData();
  }, [loadMenuItems, loadCategories, loadRecipes, loadIngredients]);

  // Load recipes for menu items once they're available
  useEffect(() => {
    const loadRecipesForItems = async () => {
      if (menuItems.length === 0) return;
      
      // Preload recipes for all menu items
      // This ensures recipes are available for display
      for (const item of menuItems) {
        // Only load if not already in store
        const existing = getRecipeByMenuItemIdSync(item.id);
        if (!existing) {
          try {
            await getRecipeByMenuItemId(item.id);
          } catch (error) {
            // Recipe doesn't exist, that's fine - just skip it
          }
        }
      }
    };
    
    loadRecipesForItems();
  }, [menuItems, getRecipeByMenuItemIdSync, getRecipeByMenuItemId]);

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats - use sync version for render-time checks
  const itemsWithRecipes = menuItems.filter(item => {
    const recipe = getRecipeByMenuItemIdSync(item.id);
    return recipe && recipe.ingredients && recipe.ingredients.length > 0;
  });

  const itemsWithLowStockIngredients = menuItems.filter(item => {
    const recipe = getRecipeByMenuItemIdSync(item.id);
    if (!recipe || !recipe.ingredients) return false;
    return recipe.ingredients.some(ri => {
      const ing = ingredients.find(i => i.id === ri.ingredientId);
      return ing?.isLowStock;
    });
  });

  const averageProfitMargin = itemsWithRecipes.reduce((sum, item) => {
    const recipe = getRecipeByMenuItemIdSync(item.id);
    if (!recipe) return sum;
    const margin = ((item.basePrice - recipe.totalCost) / item.basePrice) * 100;
    return sum + margin;
  }, 0) / (itemsWithRecipes.length || 1);

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || t('menu.unknown');
  };

  const openRecipeBuilder = (item: MenuItem) => {
    setSelectedItem(item);
    setIsRecipeDialogOpen(true);
  };

  const getRecipeInfo = (item: MenuItem) => {
    const recipe = getRecipeByMenuItemIdSync(item.id);
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      return { hasRecipe: false, cost: 0, margin: 0, hasLowStock: false, ingredientCount: 0 };
    }
    
    const cost = recipe.totalCost;
    const margin = ((item.basePrice - cost) / item.basePrice) * 100;
    const hasLowStock = recipe.ingredients.some(ri => {
      const ing = ingredients.find(i => i.id === ri.ingredientId);
      return ing?.isLowStock;
    });
    
    return { hasRecipe: true, cost, margin, hasLowStock, ingredientCount: recipe.ingredients.length || 0 };
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('menu.menuItems')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menuItems.length}</div>
            <p className="text-xs text-muted-foreground">{t('menu.totalItems')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">{t('menu.withRecipes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{itemsWithRecipes.length}</div>
            <Progress 
              value={(itemsWithRecipes.length / menuItems.length) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">{t('menu.lowStockAlert')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{itemsWithLowStockIngredients.length}</div>
            <p className="text-xs text-muted-foreground">{t('menu.itemsAffected')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('menu.avgProfitMargin')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              averageProfitMargin >= 50 ? "text-green-600" : 
              averageProfitMargin >= 30 ? "text-yellow-600" : "text-red-600"
            )}>
              {averageProfitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FlaskConical className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">{t('menu.howRecipesLinkFood')}</p>
              <p className="text-sm text-blue-600 mt-1">
                {t('menu.recipesLinkDescription')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('menu.searchMenuItems')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Items Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('menu.menuItem')}</TableHead>
              <TableHead>{t('menu.category')}</TableHead>
              <TableHead className="text-right">{t('menu.sellingPrice')}</TableHead>
              <TableHead>{t('menu.recipeStatus')}</TableHead>
              <TableHead className="text-right">{t('menu.ingredientCost')}</TableHead>
              <TableHead className="text-right">{t('menu.profitMargin')}</TableHead>
              <TableHead>{t('menu.stockStatus')}</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map(item => {
              const info = getRecipeInfo(item);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoryName(item.categoryId)}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.basePrice)}
                  </TableCell>
                  <TableCell>
                    {info.hasRecipe ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {info.ingredientCount} {t('menu.ingredients')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        <XCircle className="h-3 w-3 mr-1" />
                        {t('menu.noRecipe')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {info.hasRecipe ? (
                      <span className="text-red-600">-{formatCurrency(info.cost)}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {info.hasRecipe ? (
                      <Badge 
                        variant="outline"
                        className={cn(
                          info.margin >= 50 ? "bg-green-50 text-green-700 border-green-200" :
                          info.margin >= 30 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                          "bg-red-50 text-red-700 border-red-200"
                        )}
                      >
                        {info.margin.toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {info.hasRecipe && info.hasLowStock ? (
                      <Badge variant="destructive" className="bg-orange-100 text-orange-700 border-orange-200">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {t('menu.lowStock')}
                      </Badge>
                    ) : info.hasRecipe ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Package className="h-3 w-3 mr-1" />
                        {t('menu.ok')}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant={info.hasRecipe ? "outline" : "default"}
                      onClick={() => openRecipeBuilder(item)}
                    >
                      <FlaskConical className="h-4 w-4 mr-1" />
                      {info.hasRecipe ? t('common.edit') : t('common.create')}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredItems.length === 0 && (
          <div className="p-12 text-center">
            <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{t('menu.noMenuItemsFound')}</p>
          </div>
        )}
      </Card>

      {/* Recipe Builder Dialog */}
      <RecipeBuilder
        open={isRecipeDialogOpen}
        onOpenChange={setIsRecipeDialogOpen}
        menuItem={selectedItem}
      />
    </div>
  );
}

