import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Send, Trash2, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useOrderStore } from '@/store/orderStore';
import { useMenuStore } from '@/store/menuStore';
import { useTableStore } from '@/store/tableStore';
import { useAuthStore } from '@/store/authStore';
import { MenuItem, MenuVariant, MenuModifier } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';

export function WaiterPOSPage() {
  const { t } = useTranslation();
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  
  const { user } = useAuthStore();
  const { tables, updateTableStatus } = useTableStore();
  const { categories, menuItems, loadCategories, loadMenuItems } = useMenuStore();
  const { 
    currentOrder, 
    createOrder, 
    setCurrentOrder,
    getActiveOrderByTable,
    addItemToOrder,
    updateOrderItem,
    removeOrderItem,
    updateOrderStatus,
    loadOrders,
  } = useOrderStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(2);
  
  // Item customization
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<MenuVariant | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<MenuModifier[]>([]);
  const [itemNotes, setItemNotes] = useState('');

  const table = tables.find(t => t.id === tableId);

  useEffect(() => {
    loadCategories();
    loadMenuItems();
    loadOrders();
  }, [loadCategories, loadMenuItems, loadOrders]);

  useEffect(() => {
    if (tableId && table) {
      const existingOrder = getActiveOrderByTable(tableId);
      if (existingOrder) {
        setCurrentOrder(existingOrder);
      } else {
        setIsGuestDialogOpen(true);
      }
    }
  }, [tableId, table, getActiveOrderByTable, setCurrentOrder]);

  const handleStartOrder = async () => {
    if (tableId && table) {
      const newOrder = await createOrder(
        tableId,
        `Table ${table.tableNumber}`,
        guestCount,
        user?.id,
        user ? `${user.firstName} ${user.lastName}` : undefined
      );
      setCurrentOrder(newOrder);
      updateTableStatus(tableId, 'occupied');
      setIsGuestDialogOpen(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    if (!item.isActive || !item.isAvailable) return false;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setItemQuantity(1);
    setSelectedVariant(item.variants.length > 0 ? item.variants[0] : null);
    setSelectedModifiers([]);
    setItemNotes('');
  };

  const handleAddToOrder = () => {
    if (!currentOrder || !selectedItem) return;
    
    const basePrice = selectedVariant?.price || selectedItem.basePrice;
    const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + m.price, 0);
    const totalUnitPrice = basePrice + modifiersTotal;
    
    addItemToOrder(currentOrder.id, {
      menuItemId: selectedItem.id,
      name: selectedItem.name,
      quantity: itemQuantity,
      unitPrice: totalUnitPrice,
      totalPrice: totalUnitPrice * itemQuantity,
      variant: selectedVariant?.name,
      modifiers: selectedModifiers.map(m => m.name),
      notes: itemNotes || undefined,
    });
    
    setSelectedItem(null);
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    if (!currentOrder) return;
    
    const item = currentOrder.items.find(i => i.id === itemId);
    if (!item) return;
    
    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
      removeOrderItem(currentOrder.id, itemId);
    } else {
      updateOrderItem(currentOrder.id, itemId, {
        quantity: newQuantity,
        totalPrice: item.unitPrice * newQuantity,
      });
    }
  };

  const handleSendToKitchen = () => {
    if (!currentOrder || currentOrder.items.length === 0) return;
    
    updateOrderStatus(currentOrder.id, 'confirmed');
    navigate('/waiter');
  };

  const toggleModifier = (modifier: MenuModifier) => {
    setSelectedModifiers(prev => {
      const exists = prev.find(m => m.name === modifier.name);
      if (exists) {
        return prev.filter(m => m.name !== modifier.name);
      }
      return [...prev, modifier];
    });
  };

  if (!table) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] p-4">
        <p className="text-muted-foreground mb-4">Table not found</p>
        <Button onClick={() => navigate('/waiter')}>Back to Tables</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/waiter')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold">{t('waiter.table')} {table.tableNumber}</h1>
            <p className="text-xs text-muted-foreground">
              {currentOrder ? `${currentOrder.orderNumber} • ${currentOrder.guestCount} ${t('common.guests')}` : t('waiter.newOrder')}
            </p>
          </div>
          <Button 
            variant="outline" 
            className="relative"
            onClick={() => setIsCartOpen(true)}
          >
            {t('waiter.cart')}
            {currentOrder && currentOrder.items.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                {currentOrder.items.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Search */}
        <Input
          placeholder={t('waiter.searchMenu')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-3"
        />
      </div>

      {/* Categories */}
      <div className="border-b overflow-x-auto">
        <div className="flex p-2 gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            {t('common.all')}
          </Button>
          {categories.filter(c => c.isActive).map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              {category.icon} {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <ScrollArea className="flex-1 p-3">
        <div className="grid grid-cols-2 gap-2">
          {filteredItems.map(item => (
            <Card
              key={item.id}
              className="cursor-pointer active:scale-95 transition-all"
              onClick={() => handleItemClick(item)}
            >
              <CardContent className="p-3">
                <div className="text-xl mb-1">
                  {categories.find(c => c.id === item.categoryId)?.icon || '🍽️'}
                </div>
                <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-sm">{formatCurrency(item.basePrice)}</span>
                  {item.variants.length > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {item.variants.length} {t('waiter.sizes')}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Floating Cart Button */}
      {currentOrder && currentOrder.items.length > 0 && (
        <div className="sticky bottom-0 p-3 bg-background border-t">
          <Button className="w-full" size="lg" onClick={() => setIsCartOpen(true)}>
            {t('waiter.viewCart')} ({currentOrder.items.length}) • {formatCurrency(currentOrder.total)}
          </Button>
        </div>
      )}

      {/* Item Customization Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.name}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Quantity */}
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('common.quantity')}</span>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-bold">{itemQuantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Variants */}
                {selectedItem.variants.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-medium">{t('waiter.size')}</span>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedItem.variants.map(variant => (
                        <Button
                          key={variant.name}
                          variant={selectedVariant?.name === variant.name ? 'default' : 'outline'}
                          className="flex flex-col h-auto py-2"
                          onClick={() => setSelectedVariant(variant)}
                        >
                          <span className="text-xs">{variant.name}</span>
                          <span className="text-xs">{formatCurrency(variant.price)}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modifiers */}
                {selectedItem.modifiers.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-medium">{t('waiter.addOns')}</span>
                    {selectedItem.modifiers.map(modifier => {
                      const isSelected = selectedModifiers.some(m => m.name === modifier.name);
                      return (
                        <div
                          key={modifier.name}
                          className={cn(
                            "flex items-center justify-between p-3 rounded border cursor-pointer",
                            isSelected && "border-primary bg-primary/5"
                          )}
                          onClick={() => toggleModifier(modifier)}
                        >
                          <span>{modifier.name}</span>
                          <span className="text-muted-foreground">
                            +{formatCurrency(modifier.price)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <span className="font-medium">Special Instructions</span>
                  <Textarea
                    placeholder="Any special requests..."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button className="w-full" onClick={handleAddToOrder}>
                  {t('waiter.addToOrder')} - {formatCurrency(
                    ((selectedVariant?.price || selectedItem.basePrice) + 
                    selectedModifiers.reduce((sum, m) => sum + m.price, 0)) * itemQuantity
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{t('waiter.yourOrder')}</SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="flex-1 mt-4">
            {!currentOrder || currentOrder.items.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {t('waiter.noItemsYet')}
              </div>
            ) : (
              <div className="space-y-3">
                {currentOrder.items.map(item => (
                  <div key={item.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.variant && (
                        <p className="text-xs text-muted-foreground">{item.variant}</p>
                      )}
                      {item.modifiers.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {item.modifiers.join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-blue-600">{t('waiter.note')}: {item.notes}</p>
                      )}
                      <p className="font-medium mt-1">{formatCurrency(item.totalPrice)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => removeOrderItem(currentOrder.id, item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleQuantityChange(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {currentOrder && currentOrder.items.length > 0 && (
            <div className="border-t pt-4 mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>{t('common.subtotal')}</span>
                <span>{formatCurrency(currentOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{t('common.tax')}</span>
                <span>{formatCurrency(currentOrder.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>{t('common.total')}</span>
                <span>{formatCurrency(currentOrder.total)}</span>
              </div>
              
              <Button className="w-full" size="lg" onClick={handleSendToKitchen}>
                <Send className="mr-2 h-4 w-4" />
                {t('waiter.sendToKitchen')}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Guest Count Dialog */}
      <Dialog open={isGuestDialogOpen} onOpenChange={setIsGuestDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Start Order</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center gap-4 py-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-3xl font-bold w-12 text-center">{guestCount}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setGuestCount(guestCount + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">{t('waiter.numberOfGuests')}</p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => navigate('/waiter')}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleStartOrder}>
              {t('waiter.startOrder')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

