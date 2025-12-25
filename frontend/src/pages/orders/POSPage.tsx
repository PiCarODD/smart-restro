import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Send, X, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { useOrderStore } from '@/store/orderStore';
import { useMenuStore } from '@/store/menuStore';
import { useTableStore } from '@/store/tableStore';
import { useAuthStore } from '@/store/authStore';
import { MenuItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ModifierDialog } from '@/components/features/pos/ModifierDialog';

export function POSPage() {
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
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModifierOpen, setIsModifierOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);

  const table = tables.find(t => t.id === tableId);

  useEffect(() => {
    loadCategories();
    loadMenuItems();
    loadOrders();
  }, [loadCategories, loadMenuItems, loadOrders]);

  useEffect(() => {
    if (tableId && table) {
      // Check if there's an existing active order for this table
      const existingOrder = getActiveOrderByTable(tableId);
      if (existingOrder) {
        setCurrentOrder(existingOrder);
      } else {
        // Show guest count dialog for new order
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
    if (item.variants.length > 0 || item.modifiers.length > 0) {
      setSelectedItem(item);
      setIsModifierOpen(true);
    } else {
      addItemDirectly(item);
    }
  };

  const addItemDirectly = (item: MenuItem) => {
    if (!currentOrder) return;
    
    addItemToOrder(currentOrder.id, {
      menuItemId: item.id,
      name: item.name,
      quantity: 1,
      unitPrice: item.basePrice,
      totalPrice: item.basePrice,
      modifiers: [],
    });
  };

  const handleAddWithModifiers = (
    item: MenuItem, 
    quantity: number,
    variant: { name: string; price: number } | null, 
    selectedModifiers: { name: string; price: number }[],
    notes: string
  ) => {
    if (!currentOrder) return;
    
    const unitPrice = variant?.price || item.basePrice;
    const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + m.price, 0);
    const totalUnitPrice = unitPrice + modifiersTotal;
    
    addItemToOrder(currentOrder.id, {
      menuItemId: item.id,
      name: item.name,
      quantity,
      unitPrice: totalUnitPrice,
      totalPrice: totalUnitPrice * quantity,
      variant: variant?.name,
      modifiers: selectedModifiers.map(m => m.name),
      notes: notes || undefined,
    });
    
    setIsModifierOpen(false);
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
    setIsSendDialogOpen(false);
    navigate('/orders');
  };

  if (!table) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Table not found</p>
          <Button onClick={() => navigate('/tables')}>Back to Tables</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Left: Menu Items */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tables')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Table {table.tableNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {currentOrder ? `Order ${currentOrder.orderNumber}` : 'New Order'}
              {currentOrder && ` • ${currentOrder.guestCount} guest${currentOrder.guestCount > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Search */}
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />

        {/* Categories */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Button>
          {categories.filter(c => c.isActive).map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              {category.icon} {category.name}
            </Button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-4">
            {filteredItems.map(item => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleItemClick(item)}
              >
                <CardContent className="p-3">
                  <div className="text-2xl mb-2">
                    {categories.find(c => c.id === item.categoryId)?.icon || '🍽️'}
                  </div>
                  <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold">{formatCurrency(item.basePrice)}</span>
                    {item.variants.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {item.variants.length} sizes
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Order Panel */}
      <Card className="w-96 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Current Order</h2>
            {currentOrder && currentOrder.items.length > 0 && (
              <Badge>{currentOrder.items.length} items</Badge>
            )}
          </div>
        </div>

        {/* Order Items */}
        <ScrollArea className="flex-1 p-4">
          {!currentOrder || currentOrder.items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No items yet</p>
              <p className="text-sm">Click on items to add them</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentOrder.items.map(item => (
                <div key={item.id} className="flex gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground">{item.variant}</p>
                    )}
                    {item.modifiers.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {item.modifiers.join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-blue-600">Note: {item.notes}</p>
                    )}
                    <p className="text-sm font-medium mt-1">
                      {formatCurrency(item.totalPrice)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeOrderItem(currentOrder.id, item.id)}
                    >
                      <X className="h-4 w-4" />
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

        {/* Order Totals */}
        {currentOrder && currentOrder.items.length > 0 && (
          <div className="p-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(currentOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tax (8%)</span>
              <span>{formatCurrency(currentOrder.tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(currentOrder.total)}</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 border-t space-y-2">
          <Button 
            className="w-full" 
            size="lg"
            disabled={!currentOrder || currentOrder.items.length === 0}
            onClick={() => setIsSendDialogOpen(true)}
          >
            <Send className="mr-2 h-4 w-4" />
            Send to Kitchen
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate(`/orders/${currentOrder?.id}`)}
            disabled={!currentOrder}
          >
            View Full Order
          </Button>
        </div>
      </Card>

      {/* Modifier Dialog */}
      {selectedItem && (
        <ModifierDialog
          open={isModifierOpen}
          onOpenChange={setIsModifierOpen}
          item={selectedItem}
          onAdd={handleAddWithModifiers}
        />
      )}

      {/* Guest Count Dialog */}
      <Dialog open={isGuestDialogOpen} onOpenChange={setIsGuestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Order</DialogTitle>
            <DialogDescription>
              Enter the number of guests for Table {table.tableNumber}
            </DialogDescription>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => navigate('/tables')}>
              Cancel
            </Button>
            <Button onClick={handleStartOrder}>
              Start Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Kitchen Confirmation */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to Kitchen?</DialogTitle>
            <DialogDescription>
              This will send {currentOrder?.items.length} item(s) to the kitchen for preparation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted rounded-lg p-4 space-y-2">
              {currentOrder?.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="text-muted-foreground">{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(currentOrder?.total || 0)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
              Continue Editing
            </Button>
            <Button onClick={handleSendToKitchen}>
              <Send className="mr-2 h-4 w-4" />
              Send to Kitchen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

