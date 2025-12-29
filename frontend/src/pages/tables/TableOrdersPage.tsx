import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Receipt, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Order, OrderStatus } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { CheckoutDialog } from '@/components/features/orders/CheckoutDialog';

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  preparing: { label: 'Preparing', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  ready: { label: 'Ready', color: 'text-green-700', bgColor: 'bg-green-100' },
  picked_up: { label: 'Picked Up', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  served: { label: 'Served', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  completed: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export function TableOrdersPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
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
      
      navigate('/tables');
    }
  };

  const canCheckout = servedOrders.length > 0;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tables')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Table {table.tableNumber} - Orders</h1>
          <p className="text-muted-foreground">
            {tableOrders.length} active order{tableOrders.length !== 1 ? 's' : ''}
            {servedOrders.length > 0 && (
              <span className="ml-2">• {servedOrders.length} ready for payment</span>
            )}
          </p>
        </div>
        {canCheckout && (
          <Button onClick={handleCheckout}>
            <Receipt className="mr-2 h-4 w-4" />
            Proceed to Payment ({servedOrders.length} order{servedOrders.length !== 1 ? 's' : ''})
          </Button>
        )}
      </div>

      {/* Orders List */}
      {tableOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No active orders for this table</p>
          <Button onClick={() => navigate(`/pos/${tableId}`)}>
            Add Order
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {servedOrders.length > 1 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Combined Payment</p>
                    <p className="text-sm text-muted-foreground">
                      {servedOrders.length} served orders will be combined for payment
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">
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
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{order.orderNumber}</h3>
                          <Badge className={`${status.bgColor} ${status.color} border-0`}>
                            {status.label}
                          </Badge>
                        </div>
                        <span className="font-bold">{formatCurrency(order.total)}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                        <div>
                          <span>{order.items.length} items</span>
                        </div>
                        <div>
                          <span>{order.guestCount} guest{order.guestCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div>
                          <span>Created {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
                        </div>
                        {order.waiterName && (
                          <div>
                            <span>Server: {order.waiterName}</span>
                          </div>
                        )}
                      </div>

                      {/* Order Items Details */}
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-3 text-sm">Order Items:</h4>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div 
                              key={item.id}
                              className="flex items-start justify-between p-2 rounded bg-muted/30"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{item.quantity}×</span>
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-sm font-medium">{formatCurrency(item.totalPrice)}</span>
                                </div>
                                {item.variant && (
                                  <p className="text-sm text-muted-foreground ml-7">
                                    Size: {item.variant}
                                  </p>
                                )}
                                {item.modifiers && Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                                  <p className="text-sm text-blue-600 ml-7">
                                    Addons: {item.modifiers.join(', ')}
                                  </p>
                                )}
                                {item.notes && (
                                  <p className="text-sm text-orange-600 font-medium ml-7">
                                    ⚠️ {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Order Totals */}
                        <div className="mt-4 pt-3 border-t space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal:</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                          </div>
                          {order.tax > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tax:</span>
                              <span>{formatCurrency(order.tax)}</span>
                            </div>
                          )}
                          {order.discount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Discount:</span>
                              <span>-{formatCurrency(order.discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold pt-1 border-t">
                            <span>Total:</span>
                            <span>{formatCurrency(order.total)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        {canCancel && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleCancelOrder(order)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Order
                          </Button>
                        )}
                      </div>
                    </div>
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
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel order {orderToCancel?.orderNumber}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Order
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

