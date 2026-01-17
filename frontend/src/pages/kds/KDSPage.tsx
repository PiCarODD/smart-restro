import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { useOrderStore } from '@/store/orderStore';
import { Order, OrderItemStatus } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';

// Time thresholds for color coding (in minutes)
const WARNING_THRESHOLD = 10;
const URGENT_THRESHOLD = 15;

// Track component re-renders (reset on unmount)
let renderCount = 0;
let componentMounted = false;

export function KDSPage() {
  // Reset counter if component was unmounted
  if (!componentMounted) {
    renderCount = 0;
    componentMounted = true;
  }

  renderCount++;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      componentMounted = false;
      renderCount = 0;
    };
  }, []);

  if (renderCount > 20) {
    console.error('[KDS] ERROR: Component has rendered', renderCount, 'times! Possible infinite loop!');
    // Prevent further rendering if we're in an infinite loop
    return <div className="p-4">Error: Too many re-renders detected. Please refresh the page.</div>;
  }

  const { t } = useTranslation();

  // Use a simple selector - Zustand already optimizes this
  // Don't use custom equality check as it might be causing issues
  const orders = useOrderStore((state) => state.orders);

  // Use stable selectors for functions (they don't change)
  const loadOrders = useOrderStore((state) => state.loadOrders);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const updateItemStatus = useOrderStore((state) => state.updateItemStatus);
  const isLoading = useOrderStore((state) => state.isLoading);

  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load orders only once on mount
  useEffect(() => {
    loadOrders().catch(error => {
      console.error('Failed to load orders:', error);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoize filtered orders - only recalculate when orders array reference changes
  // This is safe because Zustand only creates a new array when orders actually change
  const kdsOrders = useMemo(() => {
    if (!Array.isArray(orders)) {
      return [];
    }
    return orders.filter(o => o && o.id && ['confirmed', 'preparing', 'ready'].includes(o.status));
  }, [orders]);

  const confirmedOrders = useMemo(() =>
    kdsOrders.filter(o => o.status === 'confirmed'),
    [kdsOrders]
  );

  const preparingOrders = useMemo(() =>
    kdsOrders.filter(o => o.status === 'preparing'),
    [kdsOrders]
  );

  const readyOrders = useMemo(() =>
    kdsOrders.filter(o => o.status === 'ready'),
    [kdsOrders]
  );

  // Helper functions - memoized to prevent recreation on every render
  const getOrderAge = useCallback((order: Order): number => {
    if (!order || !order.createdAt) return 0;
    try {
      return Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    } catch {
      return 0;
    }
  }, []);

  const getOrderUrgency = useCallback((order: Order): 'normal' | 'warning' | 'urgent' => {
    const age = getOrderAge(order);
    if (age >= URGENT_THRESHOLD) return 'urgent';
    if (age >= WARNING_THRESHOLD) return 'warning';
    return 'normal';
  }, [getOrderAge]);

  const urgencyColors = {
    normal: 'border-l-green-500',
    warning: 'border-l-yellow-500',
    urgent: 'border-l-red-500 animate-pulse',
  };

  // Handlers - memoized to prevent recreation on every render
  const handleStartPreparing = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'preparing');
      // Reload orders to get full order details including items
      await loadOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  }, [updateOrderStatus, loadOrders]);

  const handleMarkReady = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'ready');
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  }, [updateOrderStatus]);

  const handleMarkServed = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'served');
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  }, [updateOrderStatus]);

  const handleItemStatusChange = useCallback(async (orderId: string, itemId: string, status: OrderItemStatus) => {
    try {
      await updateItemStatus(orderId, itemId, status);
    } catch (error) {
      console.error('Failed to update item status:', error);
    }
  }, [updateItemStatus]);

  const renderOrderCard = (order: Order, showActions: boolean = true) => {
    if (!order || !order.id) {
      return null;
    }

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
              {(order.items && Array.isArray(order.items) && order.items.length > 0) ? (
                order.items.map(item => {
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
                        {/* Variant (Size) */}
                        {item.variant && (
                          <p className="text-sm text-muted-foreground ml-7">
                            Size: {item.variant}
                          </p>
                        )}
                        {/* Modifiers (Addons) */}
                        {item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                          <div className="text-sm text-blue-600 ml-7">
                            Addons: {item.modifiers.map((mod, idx) => {
                              const modName = typeof mod === 'string' ? mod : mod.name;
                              const modPrice = typeof mod === 'string' ? 0 : (mod.price || 0);
                              return (
                                <span key={idx}>
                                  {modName} {modPrice > 0 && `(+${formatCurrency(modPrice)})`}
                                  {idx < item.modifiers.length - 1 && ', '}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {item.modifiersTotal && item.modifiersTotal > 0 && (
                          <p className="text-sm text-muted-foreground ml-7">
                            Add-ons Total: {formatCurrency(item.modifiersTotal)}
                          </p>
                        )}
                        {/* Notes */}
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
                })
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p className="text-sm">Loading order details...</p>
                </div>
              )}
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

      {kdsOrders.length === 0 && (
        <div className="flex items-center justify-center h-full min-h-[400px]">
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

