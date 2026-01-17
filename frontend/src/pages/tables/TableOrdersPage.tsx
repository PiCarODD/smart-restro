import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Receipt, XCircle, Clock, Users, ShoppingCart, CheckCircle2, ChefHat, Plus } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { useTableStore } from '@/store/tableStore';
import { useOrderStore } from '@/store/orderStore';
import { useNavigationStore } from '@/store/navigationStore';
import { Order, OrderStatus } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { CheckoutDialog } from '@/components/features/orders/CheckoutDialog';

export function TableOrdersPage() {
  const { t } = useTranslation();
  const { pageParams, navigate } = useNavigationStore();
  const tableId = pageParams.tableId;
  const { tables, loadTables, updateTableStatus } = useTableStore();
  const { orders, loadOrders, cancelOrder, completeOrder } = useOrderStore();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [combinedOrder, setCombinedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadTables();
    loadOrders();
  }, [loadTables, loadOrders]);

  const table = tables.find(t => t.id === tableId);
  const tableOrders = orders.filter(o => o.tableId === tableId && o.status !== 'completed' && o.status !== 'cancelled');
  const servedOrders = tableOrders.filter(o => o.status === 'served');

  // Status config with translations
  const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
    pending: { label: t('orders.pending'), color: 'text-gray-700', bgColor: 'bg-gray-100' },
    confirmed: { label: t('orders.confirmed'), color: 'text-blue-700', bgColor: 'bg-blue-100' },
    preparing: { label: t('orders.preparing'), color: 'text-orange-700', bgColor: 'bg-orange-100' },
    ready: { label: t('orders.ready'), color: 'text-green-700', bgColor: 'bg-green-100' },
    picked_up: { label: t('waiter.pickedUp', { defaultValue: 'Picked Up' }), color: 'text-blue-700', bgColor: 'bg-blue-100' },
    served: { label: t('orders.served'), color: 'text-purple-700', bgColor: 'bg-purple-100' },
    completed: { label: t('orders.completed'), color: 'text-gray-700', bgColor: 'bg-gray-100' },
    cancelled: { label: t('orders.cancelled'), color: 'text-red-700', bgColor: 'bg-red-100' },
  };

  // Combine all served orders into one order for checkout
  const createCombinedOrder = (): Order | null => {
    if (servedOrders.length === 0) return null;

    // Use the first order as the base
    const baseOrder = servedOrders[0];

    // Combine all items from all served orders
    const combinedItems = servedOrders.flatMap(order => order.items);

    // Calculate combined totals
    const combinedSubtotal = servedOrders.reduce((sum, order) => sum + order.subtotal, 0);
    const combinedTax = servedOrders.reduce((sum, order) => sum + order.tax, 0);
    const combinedDiscount = servedOrders.reduce((sum, order) => sum + order.discount, 0);
    const combinedTotal = servedOrders.reduce((sum, order) => sum + order.total, 0);

    // Get max guest count
    const maxGuestCount = Math.max(...servedOrders.map(o => o.guestCount));

    return {
      ...baseOrder,
      id: 'combined', // Temporary ID
      orderNumber: servedOrders.map(o => o.orderNumber).join(' + '),
      items: combinedItems,
      subtotal: combinedSubtotal,
      tax: combinedTax,
      discount: combinedDiscount,
      total: combinedTotal,
      guestCount: maxGuestCount,
    };
  };

  const handleCancelOrder = (order: Order) => {
    if (order.status === 'served') {
      return; // Cannot cancel served orders
    }
    setOrderToCancel(order);
    setIsCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (orderToCancel) {
      await cancelOrder(orderToCancel.id);
      setIsCancelDialogOpen(false);
      setOrderToCancel(null);
      // If this was the last order, free up the table
      const remainingOrders = orders.filter(o => o.tableId === tableId && o.status !== 'completed' && o.status !== 'cancelled');
      if (remainingOrders.length === 0) {
        updateTableStatus(tableId!, 'available');
      }
    }
  };

  const handleCheckout = () => {
    const combined = createCombinedOrder();
    if (combined) {
      setCombinedOrder(combined);
      setIsCheckoutOpen(true);
    }
  };

  const handleComplete = async () => {
    if (servedOrders.length > 0) {
      // Complete all served orders
      for (const order of servedOrders) {
        await completeOrder(order.id);
      }

      // Reload orders to get updated status
      await loadOrders();

      setIsCheckoutOpen(false);
      setCombinedOrder(null);

      // Set table to cleaning after payment
      await updateTableStatus(tableId!, 'cleaning');

      navigate('tables');
    }
  };

  const canCheckout = servedOrders.length > 0;

  if (!table) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t('tables.tableNotFound')}</p>
          <Button onClick={() => navigate('tables')}>{t('tables.backToTables')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('tables')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{t('tables.tableNumber')} {table.tableNumber}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {tableOrders.length} {tableOrders.length !== 1 ? t('tables.activeOrders') : t('tables.activeOrder')}
              {servedOrders.length > 0 && (
                <span className="ml-2 text-primary font-medium">• {servedOrders.length} {t('tables.readyForPayment')}</span>
              )}
            </p>
          </div>
        </div>
        {canCheckout && (
          <Button onClick={handleCheckout} size="default" className="h-10">
            <Receipt className="mr-2 h-4 w-4" />
            {t('tables.proceedToPayment')} ({servedOrders.length} {servedOrders.length !== 1 ? t('tables.orders') : t('tables.order')})
          </Button>
        )}
      </div>

      {/* Orders List */}
      {tableOrders.length === 0 ? (
        <Card className="p-8 text-center border-2 border-dashed">
          <ShoppingCart className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-base font-medium mb-1">{t('tables.noActiveOrders')}</p>
          <p className="text-sm text-muted-foreground mb-4">{t('tables.startByCreatingOrder')}</p>
          <Button onClick={() => navigate('pos', { tableId })}>
            <Plus className="mr-2 h-4 w-4" />
            {t('tables.createNewOrder')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {servedOrders.length > 1 && (
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t('tables.combinedPayment')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('tables.servedOrdersCombined', { count: servedOrders.length })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-0.5">{t('tables.grandTotal')}</p>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(servedOrders.reduce((sum, o) => sum + o.total, 0))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {tableOrders.map(order => {
            const status = statusConfig[order.status] || { label: order.status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
            const canCancel = order.status !== 'served' && order.status !== 'completed' && order.status !== 'cancelled';

            return (
              <Card key={order.id} className="border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Order Header */}
                    <div className="flex items-start justify-between pb-3 border-b">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded ${status.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <CheckCircle2 className={`h-4 w-4 ${status.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-base font-semibold">{order.orderNumber}</h3>
                            <Badge className={`${status.bgColor} ${status.color} border-0 px-2 py-0.5 text-xs`}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <ShoppingCart className="h-3 w-3" />
                              <span>{order.items.length} {order.items.length !== 1 ? t('orders.items') : t('orders.items').slice(0, -1)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{order.guestCount} {order.guestCount !== 1 ? t('common.guests') : t('common.guest')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{format(new Date(order.createdAt), 'MMM d, h:mm a')}</span>
                            </div>
                            {order.waiterName && (
                              <div className="flex items-center gap-1">
                                <ChefHat className="h-3 w-3" />
                                <span>{order.waiterName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-0.5">{t('common.total')}</p>
                        <p className="text-lg font-bold">{formatCurrency(order.total)}</p>
                      </div>
                    </div>

                      {/* Order Items Details */}
                      <div>
                        <h4 className="font-medium mb-2 text-sm flex items-center gap-1.5 text-muted-foreground">
                          <ShoppingCart className="h-3.5 w-3.5" />
                          {t('tables.orderItems')}
                        </h4>
                        <div className="space-y-2">
                          {order.items.map((item) => {
                            // Combine name with variant inline (e.g., "Coca Cola (Small)")
                            const displayName = item.variant 
                              ? `${item.name} (${item.variant})`
                              : item.name;

                            return (
                              <div
                                key={item.id}
                                className="flex items-start justify-between p-2.5 rounded-md bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-primary text-sm">{item.quantity}×</span>
                                    <span className="font-medium text-sm">{displayName}</span>
                                  </div>
                                  {item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                                    <div className="ml-6 text-xs text-muted-foreground">
                                      {item.modifiers.map((mod, idx) => {
                                        const modName = typeof mod === 'string' ? mod : mod.name;
                                        const modPrice = typeof mod === 'string' ? 0 : (mod.price || 0);
                                        return (
                                          <span key={idx}>
                                            + {modName}{modPrice > 0 && <span className="text-primary"> ({formatCurrency(modPrice)})</span>}
                                            {idx < item.modifiers.length - 1 && ', '}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {item.notes && (
                                    <p className="ml-6 mt-1 text-xs text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded inline-block">
                                      ⚠️ {item.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="ml-3 flex-shrink-0">
                                  <p className="font-semibold text-sm">{formatCurrency(item.totalPrice)}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Order Totals */}
                      <div className="pt-2 border-t">
                        <div className="bg-muted/20 rounded p-2.5 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{t('tables.subtotal')}:</span>
                            <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                          </div>
                          {order.tax > 0 && (
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{t('tables.tax')}:</span>
                              <span className="font-medium">{formatCurrency(order.tax)}</span>
                            </div>
                          )}
                          {order.discount > 0 && (
                            <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
                              <span>{t('tables.discount')}:</span>
                              <span className="font-medium">-{formatCurrency(order.discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-border">
                            <span>{t('tables.total')}:</span>
                            <span className="text-primary">{formatCurrency(order.total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {canCancel && (
                        <div className="pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleCancelOrder(order)}
                          >
                            <XCircle className="mr-1.5 h-3.5 w-3.5" />
                            {t('tables.cancelOrder')}
                          </Button>
                        </div>
                      )}
                    </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tables.cancelOrderConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tables.cancelOrderDescription', { orderNumber: orderToCancel?.orderNumber })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('tables.keepOrder')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('tables.cancelOrder')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Checkout Dialog */}
      {combinedOrder && (
        <CheckoutDialog
          open={isCheckoutOpen}
          onOpenChange={setIsCheckoutOpen}
          order={combinedOrder}
          onComplete={handleComplete}
          individualOrders={servedOrders}
        />
      )}
    </div>
  );
}

