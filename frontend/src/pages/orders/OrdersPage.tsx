import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { Search, Eye, Receipt, Clock, CheckCircle, XCircle } from 'lucide-react';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrderStore } from '@/store/orderStore';
import { OrderStatus } from '@/types';
import { formatCurrency } from '@/lib/utils';

export function OrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orders, loadOrders, updateOrderStatus, isLoading } = useOrderStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    pending: { label: t('orders.pending'), color: 'text-gray-700', bgColor: 'bg-gray-100', icon: <Clock className="h-3 w-3" /> },
    confirmed: { label: t('orders.confirmed'), color: 'text-blue-700', bgColor: 'bg-blue-100', icon: <CheckCircle className="h-3 w-3" /> },
    preparing: { label: t('orders.preparing'), color: 'text-orange-700', bgColor: 'bg-orange-100', icon: <Clock className="h-3 w-3" /> },
    ready: { label: t('orders.ready'), color: 'text-green-700', bgColor: 'bg-green-100', icon: <CheckCircle className="h-3 w-3" /> },
    picked_up: { label: t('orders.pickedUp', { defaultValue: 'Picked Up' }), color: 'text-blue-700', bgColor: 'bg-blue-100', icon: <CheckCircle className="h-3 w-3" /> },
    served: { label: t('orders.served'), color: 'text-purple-700', bgColor: 'bg-purple-100', icon: <CheckCircle className="h-3 w-3" /> },
    completed: { label: t('orders.completed'), color: 'text-gray-700', bgColor: 'bg-gray-100', icon: <CheckCircle className="h-3 w-3" /> },
    cancelled: { label: t('orders.cancelled'), color: 'text-red-700', bgColor: 'bg-red-100', icon: <XCircle className="h-3 w-3" /> },
  };

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tableName.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = !['completed', 'cancelled'].includes(order.status);
    } else if (statusFilter !== 'all') {
      matchesStatus = order.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    active: orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    todayTotal: orders
      .filter(o => {
        const today = new Date();
        const orderDate = new Date(o.createdAt);
        return orderDate.toDateString() === today.toDateString();
      })
      .reduce((sum, o) => sum + o.total, 0),
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  if (isLoading && orders.length === 0) {
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
          <h1 className="text-3xl font-bold">{t('orders.title')}</h1>
          <p className="text-muted-foreground">{t('orders.manageAndTrack')}</p>
        </div>
        <Button onClick={() => navigate('/tables')}>
          {t('orders.newOrder')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('orders.activeOrders')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">{t('orders.preparing')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.preparing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">{t('orders.ready')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('orders.todayRevenue')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.todayTotal)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('orders.searchOrders')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('orders.filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('orders.allOrders')}</SelectItem>
            <SelectItem value="active">{t('orders.activeOrders')}</SelectItem>
            <SelectItem value="pending">{t('orders.pending')}</SelectItem>
            <SelectItem value="confirmed">{t('orders.confirmed')}</SelectItem>
            <SelectItem value="preparing">{t('orders.preparing')}</SelectItem>
            <SelectItem value="ready">{t('orders.ready')}</SelectItem>
            <SelectItem value="served">{t('orders.served')}</SelectItem>
            <SelectItem value="completed">{t('orders.completed')}</SelectItem>
            <SelectItem value="cancelled">{t('orders.cancelled')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map(order => {
          const status = statusConfig[order.status];
          
          return (
            <Card 
              key={order.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Left: Order Info */}
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{order.orderNumber}</span>
                        <Badge className={`${status.bgColor} ${status.color} border-0`}>
                          {status.icon}
                          <span className="ml-1">{status.label}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.tableName} • {order.guestCount} {order.guestCount > 1 ? t('common.guests') : t('common.guest')}
                      </p>
                    </div>
                  </div>

                  {/* Center: Items */}
                  <div className="hidden md:block flex-1 px-8">
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                    </p>
                  </div>

                  {/* Right: Time & Total */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          {t('common.actions')}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t('orders.viewDetails')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/pos/${order.tableId}`)}>
                          {t('orders.addItems')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {order.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'confirmed')}>
                            {t('orders.confirmOrder')}
                          </DropdownMenuItem>
                        )}
                        {order.status === 'confirmed' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'preparing')}>
                            {t('orders.startPreparing')}
                          </DropdownMenuItem>
                        )}
                        {order.status === 'preparing' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'ready')}>
                            {t('orders.markReady')}
                          </DropdownMenuItem>
                        )}
                        {order.status === 'ready' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'served')}>
                            {t('orders.markServed')}
                          </DropdownMenuItem>
                        )}
                        {order.status === 'served' && (
                          <DropdownMenuItem onClick={() => navigate(`/orders/${order.id}/checkout`)}>
                            <Receipt className="mr-2 h-4 w-4" />
                            {t('orders.checkout')}
                          </DropdownMenuItem>
                        )}
                        {!['completed', 'cancelled'].includes(order.status) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(order.id, 'cancelled')}
                              className="text-destructive focus:text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              {t('orders.cancelOrder')}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">{t('orders.noOrdersFound')}</p>
          <Button onClick={() => navigate('/tables')}>{t('orders.createNewOrder')}</Button>
        </Card>
      )}
    </div>
  );
}

