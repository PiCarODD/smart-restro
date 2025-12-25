import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  Package,
  TrendingDown,
  TrendingUp,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  History,
  ArrowUpDown,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
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
import { useInventoryStore } from '@/store/inventoryStore';
import { Ingredient } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
import { IngredientDialog } from '@/components/features/inventory/IngredientDialog';
import { StockAdjustmentDialog } from '@/components/features/inventory/StockAdjustmentDialog';
import { StockHistoryDialog } from '@/components/features/inventory/StockHistoryDialog';
import { CategoryManager } from '@/components/features/inventory/CategoryManager';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function InventoryPage() {
  const { t } = useTranslation();
  const { 
    ingredients,
    categories,
    loadIngredients, 
    deleteIngredient,
    getLowStockIngredients,
    isLoading 
  } = useInventoryStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [isIngredientDialogOpen, setIsIngredientDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [adjustingIngredient, setAdjustingIngredient] = useState<Ingredient | null>(null);
  const [deletingIngredient, setDeletingIngredient] = useState<Ingredient | null>(null);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, stockFilter, sortBy]);

  const lowStockIngredients = getLowStockIngredients();

  const filteredIngredients = ingredients
    .filter(ing => {
      const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || ing.category === categoryFilter;
      const matchesStock = stockFilter === 'all' || 
        (stockFilter === 'low' && ing.isLowStock) ||
        (stockFilter === 'ok' && !ing.isLowStock);
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'stock') return a.currentStock - b.currentStock;
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      if (sortBy === 'cost') return a.unitCost - b.unitCost;
      return 0;
    });

  // Pagination calculations
  const totalItems = filteredIngredients.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedIngredients = filteredIngredients.slice(startIndex, endIndex);

  const stats = {
    total: ingredients.length,
    lowStock: lowStockIngredients.length,
    totalValue: ingredients.reduce((sum, ing) => sum + (ing.currentStock * ing.unitCost), 0),
    categoriesCount: categories.length,
  };

  const getCategoryInfo = (categoryName: string) => {
    return categories.find(c => c.name === categoryName);
  };

  const openEditDialog = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setIsIngredientDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingIngredient(null);
    setIsIngredientDialogOpen(true);
  };

  const openStockDialog = (ingredient: Ingredient) => {
    setAdjustingIngredient(ingredient);
    setIsStockDialogOpen(true);
  };

  const openDeleteDialog = (ingredient: Ingredient) => {
    setDeletingIngredient(ingredient);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (deletingIngredient) {
      deleteIngredient(deletingIngredient.id);
      setIsDeleteDialogOpen(false);
      setDeletingIngredient(null);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (isLoading && ingredients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('inventory.title')}</h1>
          <p className="text-muted-foreground">Manage ingredients and stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
            <Settings2 className="mr-2 h-4 w-4" />
            {t('inventory.categories')}
          </Button>
          <Button variant="outline" onClick={() => setIsHistoryDialogOpen(true)}>
            <History className="mr-2 h-4 w-4" />
            {t('inventory.stockHistory')}
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t('inventory.addIngredient')}
          </Button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockIngredients.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">
                  {lowStockIngredients.length} {lowStockIngredients.length > 1 ? t('common.items') : 'item'} running low on stock
                </p>
                <p className="text-sm text-orange-600">
                  {lowStockIngredients.slice(0, 5).map(ing => ing.name).join(', ')}
                  {lowStockIngredients.length > 5 && ` and ${lowStockIngredients.length - 5} more`}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
                onClick={() => setStockFilter('low')}
              >
                View All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('inventory.totalIngredients')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">{t('inventory.lowStock')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold text-orange-600">{stats.lowStock}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('inventory.totalValue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</span>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setIsCategoryDialogOpen(true)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('inventory.categories')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.categoriesCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('inventory.searchIngredients')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('inventory.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('inventory.allCategories')}</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t('inventory.stock')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('inventory.allStock')}</SelectItem>
            <SelectItem value="low">{t('inventory.lowStockOnly')}</SelectItem>
            <SelectItem value="ok">{t('inventory.okStock')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px]">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t('inventory.sortBy')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{t('inventory.sortByName')}</SelectItem>
            <SelectItem value="category">{t('inventory.sortByCategory')}</SelectItem>
            <SelectItem value="stock">{t('inventory.sortByStock')}</SelectItem>
            <SelectItem value="cost">{t('inventory.sortByCost')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ingredients Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('inventory.ingredientName')}</TableHead>
              <TableHead>{t('inventory.category')}</TableHead>
              <TableHead className="text-right">{t('inventory.unitCost')}</TableHead>
              <TableHead className="text-right">{t('inventory.currentStock')}</TableHead>
              <TableHead className="text-right">{t('inventory.lowStockThreshold')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="text-right">{t('common.total')}</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedIngredients.map(ingredient => {
              const catInfo = getCategoryInfo(ingredient.category);
              return (
                <TableRow key={ingredient.id}>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      style={{ 
                        backgroundColor: catInfo ? catInfo.color + '15' : undefined,
                        borderColor: catInfo?.color,
                        color: catInfo?.color 
                      }}
                    >
                      {catInfo?.icon} {ingredient.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(ingredient.unitCost)}/{ingredient.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "font-medium",
                      ingredient.isLowStock && "text-orange-600"
                    )}>
                      {ingredient.currentStock} {ingredient.unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {ingredient.minimumStock} {ingredient.unit}
                  </TableCell>
                  <TableCell>
                    {ingredient.isLowStock ? (
                      <Badge variant="destructive" className="bg-orange-100 text-orange-700 border-orange-200">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {t('inventory.lowStock')}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {t('inventory.okStock')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(ingredient.currentStock * ingredient.unitCost)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openStockDialog(ingredient)}>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          {t('inventory.adjustStock')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(ingredient)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(ingredient)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {filteredIngredients.length === 0 && (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{t('inventory.noIngredientsFound')}</p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              {t('inventory.addFirstIngredient')}
            </Button>
          </div>
        )}

        {/* Pagination */}
        {filteredIngredients.length > 0 && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Show</span>
              <Select 
                value={pageSize.toString()} 
                onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}
              >
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>{t('common.rowsPerPage')}</span>
              <span className="mx-2">•</span>
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} {t('common.of')} {totalItems}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="h-4 w-4 -ml-2" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 -ml-2" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Category Manager Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('inventory.manageCategories')}</DialogTitle>
          </DialogHeader>
          <CategoryManager />
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      <IngredientDialog
        open={isIngredientDialogOpen}
        onOpenChange={setIsIngredientDialogOpen}
        editingIngredient={editingIngredient}
      />

      <StockAdjustmentDialog
        open={isStockDialogOpen}
        onOpenChange={setIsStockDialogOpen}
        ingredient={adjustingIngredient}
      />

      <StockHistoryDialog
        open={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('inventory.deleteIngredient')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('inventory.deleteIngredientConfirm', { name: deletingIngredient?.name || '' })}
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

