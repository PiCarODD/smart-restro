import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChefHat, 
  Clock, 
  Bell,
  Volume2, 
  VolumeX,
  CheckCircle,
  AlertTriangle,
  Utensils,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrderStore } from '@/store/orderStore';
import { Order, OrderItem, OrderItemStatus } from '@/types';
import { cn } from '@/lib/utils';

// Time thresholds for color coding (in minutes)
const WARNING_THRESHOLD = 10;
const URGENT_THRESHOLD = 15;

export function KDSPage() {
  const { t } = useTranslation();
  
  // Use individual selectors - Zustand optimizes these automatically
  const orders = useOrderStore((state) => state.orders);
  const loadOrders = useOrderStore((state) => state.loadOrders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const updateItemStatus = useOrderStore((state) => state.updateItemStatus);
  const isLoading = useOrderStore((state) => state.isLoading);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'orders' | 'items'>('orders');

  // Load orders only once on mount
  useEffect(() => {
    loadOrders().catch(error => {
      console.error('Failed to load orders:', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter orders with safety checks
  const kdsOrders = Array.isArray(orders) 
    ? orders.filter(o => o && ['confirmed', 'preparing', 'ready'].includes(o.status))
    : [];
  const confirmedOrders = kdsOrders.filter(o => o.status === 'confirmed');
  const preparingOrders = kdsOrders.filter(o => o.status === 'preparing');
  const readyOrders = kdsOrders.filter(o => o.status === 'ready');

  // Helper functions
  const getOrderAge = (order: Order): number => {
    if (!order || !order.createdAt) return 0;
    try {
      return Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    } catch {
      return 0;
    }
  };

  const getOrderUrgency = (order: Order): 'normal' | 'warning' | 'urgent' => {
    const age = getOrderAge(order);
    if (age >= URGENT_THRESHOLD) return 'urgent';
    if (age >= WARNING_THRESHOLD) return 'warning';
    return 'normal';
  };

  const urgencyColors = {
    normal: 'border-l-green-500',
    warning: 'border-l-yellow-500',
    urgent: 'border-l-red-500 animate-pulse',
  };

  // Handlers - NO auto reload to prevent loops
  const handleStartPreparing = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'preparing');
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'ready');
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleMarkServed = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'served');
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const handleItemStatusChange = async (orderId: string, itemId: string, status: OrderItemStatus) => {
    try {
      await updateItemStatus(orderId, itemId, status);
    } catch (error) {
      console.error('Failed to update item status:', error);
    }
  };

  const renderOrderCard = (order: Order, showActions: boolean = true) => {
    if (!order || !order.id) return null;
    
    try {
      const urgency = getOrderUrgency(order);
      const age = getOrderAge(order);
      
      return (
        <Card 
          key={order.id}
          className={cn(
            "border-l-4 transition-all",
            urgencyColors[urgency]
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{order.orderNumber || 'N/A'}</CardTitle>
                <Badge variant="outline">{order.tableName || 'N/A'}</Badge>
              </div>
              <div className={cn(
                "flex items-center gap-1 text-sm",
                urgency === 'urgent' ? 'text-red-600 font-bold' :
                urgency === 'warning' ? 'text-yellow-600' : 'text-muted-foreground'
              )}>
                <Clock className="h-4 w-4" />
                <span>{age}m</span>
                {urgency === 'urgent' && <AlertTriangle className="h-4 w-4" />}
              </div>
            </div>
            {order.waiterName && (
              <p className="text-sm text-muted-foreground">Server: {order.waiterName}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {(order.items || []).map(item => {
                if (!item || !item.id) return null;
                return (
                  <div 
                    key={item.id}
                    className={cn(
                      "flex items-start justify-between p-2 rounded",
                      item.status === 'ready' ? 'bg-green-50 line-through opacity-60' :
                      item.status === 'preparing' ? 'bg-yellow-50' : 'bg-muted/50'
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{item.quantity || 0}×</span>
                        <span className="font-medium">{item.name || 'Unknown'}</span>
                      </div>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground ml-7">{item.variant}</p>
                      )}
                      {item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                        <p className="text-sm text-blue-600 ml-7">+ {item.modifiers.join(', ')}</p>
                      )}
                      {item.notes && (
                        <p className="text-sm text-orange-600 font-medium ml-7">⚠️ {item.notes}</p>
                      )}
                    </div>
                    {order.status === 'preparing' && item.status !== 'ready' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="shrink-0"
                        onClick={() => handleItemStatusChange(order.id, item.id, 'ready')}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {showActions && (
              <div className="flex gap-2">
                {order.status === 'confirmed' && (
                  <Button 
                    className="flex-1" 
                    onClick={() => handleStartPreparing(order.id)}
                  >
                    <ChefHat className="mr-2 h-4 w-4" />
                    {t('kds.markPreparing')}
                  </Button>
                )}
                {order.status === 'preparing' && (
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700" 
                    onClick={() => handleMarkReady(order.id)}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t('kds.markReady')}
                  </Button>
                )}
                {order.status === 'ready' && (
                  <Button 
                    className="flex-1 bg-purple-600 hover:bg-purple-700" 
                    onClick={() => handleMarkServed(order.id)}
                  >
                    <Utensils className="mr-2 h-4 w-4" />
                    {t('kds.markServed')}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      );
    } catch (error) {
      console.error('Error rendering order card:', error);
      return null;
    }
  };

  if (isLoading && (!orders || orders.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="h-8 w-8" />
            <h1 className="text-3xl font-bold">{t('kds.title')}</h1>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {kdsOrders.length} active orders
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'orders' | 'items')}>
            <TabsList>
              <TabsTrigger value="orders">{t('kds.ordersView')}</TabsTrigger>
              <TabsTrigger value="items">{t('kds.itemsView')}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="default"
            onClick={() => window.open('/kds/fullscreen', '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {t('kds.openFullscreen')}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span>Normal (&lt;{WARNING_THRESHOLD}m)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span>Warning ({WARNING_THRESHOLD}-{URGENT_THRESHOLD}m)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span>Urgent (&gt;{URGENT_THRESHOLD}m)</span>
        </div>
      </div>

      {viewMode === 'orders' ? (
        <div className="grid grid-cols-3 gap-4 h-[calc(100%-6rem)]">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <Bell className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-lg">{t('kds.confirmed')}</h2>
              <Badge className="bg-blue-100 text-blue-700">{confirmedOrders.length}</Badge>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-2">
                {confirmedOrders.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {t('kds.noConfirmedOrders')}
                  </div>
                ) : (
                  confirmedOrders.map(order => renderOrderCard(order))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <ChefHat className="h-5 w-5 text-orange-600" />
              <h2 className="font-semibold text-lg">{t('kds.preparing')}</h2>
              <Badge className="bg-orange-100 text-orange-700">{preparingOrders.length}</Badge>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-2">
                {preparingOrders.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {t('kds.noPreparingOrders')}
                  </div>
                ) : (
                  preparingOrders.map(order => renderOrderCard(order))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="font-semibold text-lg">{t('kds.ready')}</h2>
              <Badge className="bg-green-100 text-green-700">{readyOrders.length}</Badge>
            </div>
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-2">
                {readyOrders.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {t('kds.noReadyOrders')}
                  </div>
                ) : (
                  readyOrders.map(order => renderOrderCard(order))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100%-6rem)]">
          <ItemsView orders={kdsOrders} onItemReady={handleItemStatusChange} />
        </ScrollArea>
      )}

      {kdsOrders.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <ChefHat className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-bold text-muted-foreground">All caught up!</h2>
            <p className="text-muted-foreground">No orders to prepare right now.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Items View Component
function ItemsView({ 
  orders, 
  onItemReady 
}: { 
  orders: Order[]; 
  onItemReady: (orderId: string, itemId: string, status: OrderItemStatus) => void;
}) {
  try {
    const itemGroups: Record<string, Array<{ order: Order; item: OrderItem }>> = {};
    
    (orders || []).forEach(order => {
      if (!order || !order.items) return;
      order.items.forEach(item => {
        if (item && item.status !== 'ready' && item.status !== 'served') {
          const key = item.name || 'Unknown';
          if (!itemGroups[key]) {
            itemGroups[key] = [];
          }
          itemGroups[key].push({ order, item });
        }
      });
    });

    const groupedItems = Object.entries(itemGroups).sort((a, b) => b[1].length - a[1].length);

    if (groupedItems.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-12">
          No pending items
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {groupedItems.map(([itemName, items]) => (
          <Card key={itemName}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{itemName}</CardTitle>
                <Badge className="bg-primary">{items.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map(({ order, item }) => (
                  <div 
                    key={`${order.id}-${item.id}`}
                    className={cn(
                      "flex items-center justify-between p-2 rounded text-sm",
                      item.status === 'preparing' ? 'bg-yellow-50' : 'bg-muted/50'
                    )}
                  >
                    <div>
                      <span className="font-bold">{item.quantity || 0}×</span>
                      <span className="ml-2">{order.tableName || 'N/A'}</span>
                      {item.variant && <span className="text-muted-foreground ml-1">({item.variant})</span>}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => onItemReady(order.id, item.id, 'ready')}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  } catch (error) {
    console.error('Error in ItemsView:', error);
    return (
      <div className="text-center text-red-500 py-12">
        Error loading items view
      </div>
    );
  }
}
