import { useEffect, useState } from 'react';
import { useNavigationStore } from '@/store/navigationStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQRStore } from '@/store/qrStore';
import { ShoppingCart, Package, Receipt, Bell, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function QRViewPage() {
  const { pageParams } = useNavigationStore();
  const token = pageParams.token;
  const {
    tableInfo,
    tableOrders,
    loadingTableInfo,
    errorTableInfo,
    loadTableInfo,
    loadTableOrders,
    createOrderViaQR,
    requestPayment,
    clearTableInfo
  } = useQRStore();

  const [cart, setCart] = useState<Array<{ menuItemId: string; name: string; price: number; quantity: number }>>([]);
  const [activeTab, setActiveTab] = useState('menu');

  useEffect(() => {
    if (token) {
      loadTableInfo(token).catch(console.error);
      loadTableOrders(token).catch(console.error);
    }

    return () => {
      clearTableInfo();
    };
  }, [token]);

  // Auto-refresh orders every 10 seconds
  useEffect(() => {
    if (!token || !tableInfo?.isValid) return;

    const interval = setInterval(() => {
      loadTableOrders(token).catch(console.error);
    }, 10000);

    return () => clearInterval(interval);
  }, [token, tableInfo?.isValid]);

  const handleAddToCart = (item: any) => {
    if (!item.isAvailable) return;

    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i =>
          i.menuItemId === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, {
        menuItemId: item.id,
        name: item.name,
        price: item.basePrice,
        quantity: 1
      }];
    });
  };

  const handleRemoveFromCart = (menuItemId: string) => {
    setCart(prev => prev.filter(i => i.menuItemId !== menuItemId));
  };

  const handleUpdateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(menuItemId);
      return;
    }
    setCart(prev =>
      prev.map(i =>
        i.menuItemId === menuItemId ? { ...i, quantity } : i
      )
    );
  };

  const handlePlaceOrder = async () => {
    if (!token || cart.length === 0) return;

    try {
      await createOrderViaQR(token, {
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity
        }))
      });
      setCart([]);
      setActiveTab('orders');
      // Reload orders
      await loadTableOrders(token);
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  const handleRequestPayment = async () => {
    if (!token) return;

    try {
      await requestPayment(token);
      alert('Payment request sent to staff. They will be with you shortly.');
    } catch (error) {
      console.error('Failed to request payment:', error);
      alert('Failed to send payment request. Please try again.');
    }
  };

  if (loadingTableInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorTableInfo || !tableInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invalid QR Code</CardTitle>
            <CardDescription>
              {errorTableInfo || 'This QR code is not valid or has expired.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please contact your server for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tableInfo.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>QR Code Expired</CardTitle>
            <CardDescription>
              This QR code is no longer valid. All orders have been paid.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmount = tableOrders?.totals.totalAmount || 0;

  // Group menu items by category
  const menuByCategory = tableInfo.menuItems.reduce((acc, item) => {
    const categoryName = item.category?.name || 'Other';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, typeof tableInfo.menuItems>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold">{tableInfo.restaurant.name}</h1>
          <p className="text-sm opacity-90">Table {tableInfo.table.number}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full">
            <TabsTrigger value="menu" className="flex-1">
              <Package className="h-4 w-4 mr-2" />
              Menu
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex-1">
              <Receipt className="h-4 w-4 mr-2" />
              Orders ({tableOrders?.totals.orderCount || 0})
            </TabsTrigger>
            <TabsTrigger value="invoice" className="flex-1">
              <Receipt className="h-4 w-4 mr-2" />
              Invoice
            </TabsTrigger>
          </TabsList>

          {/* Menu Tab */}
          <TabsContent value="menu" className="space-y-4">
            {Object.entries(menuByCategory).map(([category, items]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-4 p-3 rounded-lg border ${
                        !item.isAvailable ? 'opacity-50' : ''
                      }`}
                    >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(item.basePrice)}</p>
                            {!item.isAvailable && (
                              <Badge variant="outline" className="mt-1">
                                Unavailable
                              </Badge>
                            )}
                          </div>
                        </div>
                        {item.isAvailable && (
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => handleAddToCart(item)}
                          >
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Cart Summary */}
            {cart.length > 0 && (
              <Card className="sticky bottom-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {cart.map(item => (
                    <div key={item.menuItemId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.menuItemId, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.menuItemId, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromCart(item.menuItemId)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-lg">{formatCurrency(cartTotal)}</span>
                  </div>
                  <Button className="w-full mt-4" onClick={handlePlaceOrder}>
                    Place Order
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            {tableOrders && tableOrders.orders.length > 0 ? (
              tableOrders.orders.map(order => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Order {order.orderNumber}</CardTitle>
                        <CardDescription>
                          Placed {new Date(order.placedAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <Badge>{order.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {order.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span>{formatCurrency(item.totalPrice)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t font-semibold">
                      <span>Total:</span>
                      <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No orders yet
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Invoice Tab */}
          <TabsContent value="invoice" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Invoice</CardTitle>
                <CardDescription>All unpaid orders for this table</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tableOrders && tableOrders.orders.length > 0 ? (
                  <>
                    {tableOrders.orders.map(order => (
                      <div key={order.id} className="border-b pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Order {order.orderNumber}</span>
                          <span>{formatCurrency(order.totalAmount)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-4 border-t text-xl font-bold">
                      <span>Total Due:</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                    <Button
                      className="w-full mt-4"
                      size="lg"
                      onClick={handleRequestPayment}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Request Payment
                    </Button>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground">
                    No orders to display
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
