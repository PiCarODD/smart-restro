import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Clock, CheckCircle, AlertCircle, ChefHat, Utensils, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { OrderStatus } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';

export function WaiterOrdersPage() {
  const { t } = useTranslation();
  
  const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    pending: { label: t('waiter.pending'), color: 'text-gray-700', bgColor: 'bg-gray-100', icon: <Clock className="h-4 w-4" /> },
    confirmed: { label: t('waiter.inQueue'), color: 'text-blue-700', bgColor: 'bg-blue-100', icon: <Clock className="h-4 w-4" /> },
    preparing: { label: t('waiter.preparing'), color: 'text-orange-700', bgColor: 'bg-orange-100', icon: <ChefHat className="h-4 w-4" /> },
    ready: { label: t('waiter.ready'), color: 'text-green-700', bgColor: 'bg-green-100', icon: <CheckCircle className="h-4 w-4" /> },
    picked_up: { label: t('waiter.pickedUp'), color: 'text-blue-700', bgColor: 'bg-blue-100', icon: <Package className="h-4 w-4" /> },
    served: { label: t('waiter.served'), color: 'text-purple-700', bgColor: 'bg-purple-100', icon: <Utensils className="h-4 w-4" /> },
    completed: { label: t('waiter.completed'), color: 'text-gray-700', bgColor: 'bg-gray-100', icon: <CheckCircle className="h-4 w-4" /> },
    cancelled: { label: t('waiter.cancelled'), color: 'text-red-700', bgColor: 'bg-red-100', icon: <AlertCircle className="h-4 w-4" /> },
  };
  const navigate = useNavigate();
  useAuthStore();
  const { orders, loadOrders, updateOrderStatus } = useOrderStore();

  useEffect(() => {
    loadOrders();
    // Refresh every 10 seconds
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Filter orders that are active (not completed/cancelled)
  const myOrders = orders.filter(o => 
    !['completed', 'cancelled'].includes(o.status)
  ).sort((a, b) => {
    // Ready orders first
    if (a.status === 'ready' && b.status !== 'ready') return -1;
    if (a.status !== 'ready' && b.status === 'ready') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const readyOrders = myOrders.filter(o => o.status === 'ready');
  const pickedUpOrders = myOrders.filter(o => o.status === 'picked_up');
  const preparingOrders = myOrders.filter(o => ['confirmed', 'preparing'].includes(o.status));
  const servedOrders = myOrders.filter(o => o.status === 'served');

  const handlePickupOrder = (orderId: string) => {
    // Confirm pickup from kitchen
    updateOrderStatus(orderId, 'picked_up');
  };

  const handleMarkServed = (orderId: string) => {
    updateOrderStatus(orderId, 'served');
  };

  return (
    <div className="p-4 space-y-4">
      {/* Alert for Ready Orders */}
      {readyOrders.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700 font-medium">
              <CheckCircle className="h-5 w-5" />
              <span>{readyOrders.length} order{readyOrders.length > 1 ? 's' : ''} ready for pickup!</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active">
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">
            {t('waiter.active')} ({preparingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="ready" className="flex-1 relative">
            {t('waiter.ready')}
            {readyOrders.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                {readyOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="picked_up" className="flex-1">
            {t('waiter.pickedUp')} ({pickedUpOrders.length})
          </TabsTrigger>
          <TabsTrigger value="served" className="flex-1">
            {t('waiter.served')} ({servedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-3">
          {preparingOrders.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <ChefHat className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('waiter.noOrdersInProgress')}</p>
            </div>
          ) : (
            preparingOrders.map(order => {
              const status = statusConfig[order.status];
              return (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{order.orderNumber}</span>
                          <Badge className={cn(status.bgColor, status.color, "border-0")}>
                            {status.icon}
                            <span className="ml-1">{status.label}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.tableName} • {order.guestCount} {t('common.guests')}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.items.map(item => `${item.quantity}× ${item.name}`).join(', ')}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="font-medium">{formatCurrency(order.total)}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/waiter/pos/${order.tableId}`)}
                      >
                        {t('waiter.addItems')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="ready" className="mt-4 space-y-3">
          {readyOrders.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('waiter.noOrdersReady')}</p>
            </div>
          ) : (
            readyOrders.map(order => (
              <Card key={order.id} className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{order.orderNumber}</span>
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t('waiter.ready')}!
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.tableName} • {order.guestCount} {t('common.guests')}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {order.items.map(item => `${item.quantity}× ${item.name}`).join(', ')}
                  </div>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 mb-2"
                    onClick={() => handlePickupOrder(order.id)}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    {t('waiter.pickUpFromKitchen')}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="picked_up" className="mt-4 space-y-3">
          {pickedUpOrders.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('waiter.noPickedUpOrders')}</p>
            </div>
          ) : (
            pickedUpOrders.map(order => {
              const status = statusConfig[order.status];
              return (
                <Card key={order.id} className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{order.orderNumber}</span>
                          <Badge className={cn(status.bgColor, status.color, "border-0")}>
                            {status.icon}
                            <span className="ml-1">{status.label}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.tableName} • {order.guestCount} {t('common.guests')}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      {order.items.map(item => `${item.quantity}× ${item.name}`).join(', ')}
                    </div>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleMarkServed(order.id)}
                    >
                      <Utensils className="mr-2 h-4 w-4" />
                      {t('waiter.markAsServed')}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="served" className="mt-4 space-y-3">
          {servedOrders.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Utensils className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('waiter.noServedOrders')}</p>
            </div>
          ) : (
            servedOrders.map(order => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-bold">{order.orderNumber}</span>
                      <p className="text-sm text-muted-foreground">
                        {order.tableName} • {order.guestCount} {t('common.guests')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{formatCurrency(order.total)}</span>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{t('waiter.awaitingPayment')}</Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

