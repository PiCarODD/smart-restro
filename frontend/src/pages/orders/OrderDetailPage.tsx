import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Receipt, 
  Plus,
  Printer,
  CheckCircle,
  XCircle,
  ChefHat,
  Utensils
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { useOrderStore } from '@/store/orderStore';
import { useTableStore } from '@/store/tableStore';
import { OrderStatus, OrderItemStatus } from '@/types';
import { formatCurrency } from '@/lib/utils';

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

const itemStatusConfig: Record<OrderItemStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-gray-600' },
  preparing: { label: 'Preparing', color: 'text-orange-600' },
  ready: { label: 'Ready', color: 'text-green-600' },
  served: { label: 'Served', color: 'text-purple-600' },
  cancelled: { label: 'Cancelled', color: 'text-red-600' },
};

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { orders, loadOrders, updateOrderStatus, cancelOrder } = useOrderStore();
  const { updateTableStatus } = useTableStore();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Order not found</p>
          <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status] || { label: order.status || 'Unknown', color: 'text-gray-700', bgColor: 'bg-gray-100' };

  const handleStatusUpdate = (newStatus: OrderStatus) => {
    updateOrderStatus(order.id, newStatus);
  };

  const handleCancel = () => {
    cancelOrder(order.id);
    // Free up the table
    updateTableStatus(order.tableId, 'available');
    setIsCancelDialogOpen(false);
  };


  const getNextStatus = (): OrderStatus | null => {
    const flow: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'served'];
    const currentIndex = flow.indexOf(order.status);
    if (currentIndex >= 0 && currentIndex < flow.length - 1) {
      return flow[currentIndex + 1];
    }
    return null;
  };

  const nextStatus = getNextStatus();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/orders')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
            <Badge className={`${status.bgColor} ${status.color} border-0`}>
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {order.tableName} • Created {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex gap-2">
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <>
              <Button variant="outline" onClick={() => navigate(`/pos/${order.tableId}`)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Items
              </Button>
              {order.status === 'served' && (
                <Button onClick={() => navigate(`/tables/${order.tableId}/orders`)}>
                  <Receipt className="mr-2 h-4 w-4" />
                  View Orders
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Items */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map(item => {
                const itemStatus = itemStatusConfig[item.status] || { label: item.status || 'Unknown', color: 'text-gray-600' };
                return (
                  <div key={item.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.quantity}x</span>
                        <span className="font-medium">{item.name}</span>
                        {itemStatus && (
                          <span className={`text-xs ${itemStatus.color}`}>
                            • {itemStatus.label}
                          </span>
                        )}
                      </div>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground ml-6">{item.variant}</p>
                      )}
                      {item.modifiers.length > 0 && (
                        <p className="text-sm text-muted-foreground ml-6">
                          {item.modifiers.join(', ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-sm text-blue-600 ml-6">Note: {item.notes}</p>
                      )}
                    </div>
                    <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                  </div>
                );
              })}
            </div>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Info & Actions */}
        <div className="space-y-4">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>Order Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Utensils className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Table</p>
                  <p className="font-medium">{order.tableName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Guests</p>
                  <p className="font-medium">{order.guestCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{format(new Date(order.createdAt), 'MMM d, h:mm a')}</p>
                </div>
              </div>
              {order.waiterName && (
                <div className="flex items-center gap-3">
                  <ChefHat className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Server</p>
                    <p className="font-medium">{order.waiterName}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {nextStatus && (
                  <Button className="w-full" onClick={() => handleStatusUpdate(nextStatus)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {nextStatus === 'confirmed' && 'Confirm Order'}
                    {nextStatus === 'preparing' && 'Start Preparing'}
                    {nextStatus === 'ready' && 'Mark Ready'}
                    {nextStatus === 'served' && 'Mark Served'}
                  </Button>
                )}
                <Button variant="outline" className="w-full">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
                {order.status !== 'served' && (
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive hover:text-destructive"
                    onClick={() => setIsCancelDialogOpen(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Order
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'served', 'completed'].map((s, index) => {
                  const statusInfo = statusConfig[s as OrderStatus];
                  const isCurrent = order.status === s;
                  const isPast = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'served', 'completed']
                    .indexOf(order.status) > index;
                  const isCancelled = order.status === 'cancelled';
                  
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        isCancelled ? 'bg-gray-300' :
                        isCurrent ? 'bg-primary animate-pulse' :
                        isPast ? 'bg-primary' : 'bg-gray-200'
                      }`} />
                      <span className={`text-sm ${
                        isCancelled ? 'text-muted-foreground' :
                        isCurrent ? 'font-medium' :
                        isPast ? 'text-muted-foreground' : 'text-muted-foreground/50'
                      }`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  );
                })}
                {order.status === 'cancelled' && (
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-red-600">Cancelled</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel order {order.orderNumber}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

