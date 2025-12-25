import { useEffect, useState } from 'react';
import { 
  ChefHat, 
  Clock, 
  Volume2, 
  VolumeX,
  CheckCircle,
  AlertTriangle,
  Utensils,
  Maximize,
  Minimize,
  RefreshCw,
  Moon,
  Sun,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOrderStore } from '@/store/orderStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Order, OrderItemStatus } from '@/types';
import { cn } from '@/lib/utils';

// Time thresholds for color coding (in minutes)
const WARNING_THRESHOLD = 10;
const URGENT_THRESHOLD = 15;

export function KDSStandalonePage() {
  const { 
    orders, 
    loadOrders, 
    updateOrderStatus, 
    updateItemStatus,
  } = useOrderStore();
  
  const { kdsTheme, setKdsTheme } = useSettingsStore();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const isDark = kdsTheme === 'dark';

  useEffect(() => {
    loadOrders();
    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Play notification sound for new orders
  useEffect(() => {
    const confirmedOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'preparing');
    if (soundEnabled && confirmedOrders.length > lastOrderCount && lastOrderCount > 0) {
      // Play notification sound
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleJh+i3VXTmZwb3yMp7e7r6CZk4h8bmNjY2l2iJqqr6yil5CPkpaXl5WVnpyso5eKfnd3gImOmJeRjo+QlZaYmZqbnp2enJqanJ6enJubmp2fnpuamJmcnZ2cnJydnJ2enJubmpucnJybm5qampubm5ycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJycnJyc');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {}
    }
    setLastOrderCount(confirmedOrders.length);
  }, [orders, soundEnabled, lastOrderCount]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Filter orders for KDS
  const kdsOrders = orders.filter(o => 
    ['confirmed', 'preparing', 'ready'].includes(o.status)
  );

  const confirmedOrders = kdsOrders.filter(o => o.status === 'confirmed');
  const preparingOrders = kdsOrders.filter(o => o.status === 'preparing');
  const readyOrders = kdsOrders.filter(o => o.status === 'ready');

  const getOrderAge = (order: Order): number => {
    return Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  };

  const getOrderUrgency = (order: Order): 'normal' | 'warning' | 'urgent' => {
    const age = getOrderAge(order);
    if (age >= URGENT_THRESHOLD) return 'urgent';
    if (age >= WARNING_THRESHOLD) return 'warning';
    return 'normal';
  };

  const urgencyColors = {
    normal: 'border-l-green-500 border-l-4',
    warning: 'border-l-yellow-500 border-l-4',
    urgent: 'border-l-red-500 border-l-4 animate-pulse',
  };

  const handleStartPreparing = (orderId: string) => {
    updateOrderStatus(orderId, 'preparing');
  };

  const handleMarkReady = (orderId: string) => {
    updateOrderStatus(orderId, 'ready');
  };

  const handleMarkServed = (orderId: string) => {
    updateOrderStatus(orderId, 'served');
  };

  const handleItemStatusChange = (orderId: string, itemId: string, status: OrderItemStatus) => {
    updateItemStatus(orderId, itemId, status);
    
    const order = orders.find(o => o.id === orderId);
    if (order && status === 'ready') {
      const allItemsReady = order.items.every(
        item => item.id === itemId ? true : item.status === 'ready'
      );
      if (allItemsReady) {
        updateOrderStatus(orderId, 'ready');
      }
    }
  };

  const renderOrderCard = (order: Order) => {
    const urgency = getOrderUrgency(order);
    const age = getOrderAge(order);
    
    return (
      <Card 
        key={order.id}
        className={cn(
          "transition-all",
          isDark ? "bg-gray-800 border-gray-700" : "bg-white",
          urgencyColors[urgency]
        )}
      >
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold">{order.orderNumber}</CardTitle>
              <Badge variant="outline" className="text-base">{order.tableName}</Badge>
            </div>
            <div className={cn(
              "flex items-center gap-1 text-lg font-bold",
              urgency === 'urgent' ? 'text-red-600' :
              urgency === 'warning' ? 'text-yellow-600' : 'text-green-600'
            )}>
              <Clock className="h-5 w-5" />
              <span>{age}m</span>
              {urgency === 'urgent' && <AlertTriangle className="h-5 w-5 ml-1" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {/* Order Items */}
          <div className="space-y-2 mb-3">
            {order.items.map(item => (
              <div 
                key={item.id}
                className={cn(
                  "flex items-start justify-between p-2 rounded text-sm",
                  item.status === 'ready' ? 'bg-green-100 line-through opacity-60' :
                  item.status === 'preparing' ? 'bg-yellow-100' : 'bg-muted'
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xl">{item.quantity}×</span>
                    <span className="font-semibold text-lg">{item.name}</span>
                  </div>
                  {item.variant && (
                    <p className="text-muted-foreground ml-8">{item.variant}</p>
                  )}
                  {item.modifiers.length > 0 && (
                    <p className="text-blue-600 ml-8 font-medium">+ {item.modifiers.join(', ')}</p>
                  )}
                  {item.notes && (
                    <p className="text-orange-600 font-bold ml-8">⚠️ {item.notes}</p>
                  )}
                </div>
                {order.status === 'preparing' && item.status !== 'ready' && (
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="shrink-0 h-12 w-12"
                    onClick={() => handleItemStatusChange(order.id, item.id, 'ready')}
                  >
                    <CheckCircle className="h-6 w-6" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {order.status === 'confirmed' && (
              <Button 
                className="flex-1 h-14 text-lg" 
                onClick={() => handleStartPreparing(order.id)}
              >
                <ChefHat className="mr-2 h-6 w-6" />
                Start Preparing
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button 
                className="flex-1 h-14 text-lg bg-green-600 hover:bg-green-700" 
                onClick={() => handleMarkReady(order.id)}
              >
                <CheckCircle className="mr-2 h-6 w-6" />
                All Ready
              </Button>
            )}
            {order.status === 'ready' && (
              <Button 
                className="flex-1 h-14 text-lg bg-purple-600 hover:bg-purple-700" 
                onClick={() => handleMarkServed(order.id)}
              >
                <Utensils className="mr-2 h-6 w-6" />
                Mark Served
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col",
      isDark ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
    )}>
      {/* Header */}
      <header className={cn(
        "border-b px-6 py-3 flex items-center justify-between",
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center gap-4">
          <ChefHat className={cn("h-10 w-10", isDark ? "text-blue-400" : "text-blue-600")} />
          <div>
            <h1 className="text-2xl font-bold">Kitchen Display System</h1>
            <p className={isDark ? "text-gray-400" : "text-gray-500"}>
              {currentTime.toLocaleTimeString()} • {kdsOrders.length} active orders
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-4 mr-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>&lt;{WARNING_THRESHOLD}m</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span>{WARNING_THRESHOLD}-{URGENT_THRESHOLD}m</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>&gt;{URGENT_THRESHOLD}m</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadOrders()}
            className={isDark ? "border-gray-600 hover:bg-gray-700" : ""}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={isDark ? "border-gray-600 hover:bg-gray-700" : ""}
          >
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setKdsTheme(isDark ? 'light' : 'dark')}
            className={isDark ? "border-gray-600 hover:bg-gray-700" : ""}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className={isDark ? "border-gray-600 hover:bg-gray-700" : ""}
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        {kdsOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ChefHat className="h-24 w-24 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="text-3xl font-bold text-muted-foreground">All caught up!</h2>
              <p className="text-xl text-muted-foreground mt-2">No orders to prepare right now.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 h-full">
            {/* New Orders Column */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-blue-500">
                <Badge className="bg-blue-500 text-white text-lg px-3 py-1">
                  {confirmedOrders.length}
                </Badge>
                <h2 className="font-bold text-xl">New Orders</h2>
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-3 pr-2">
                  {confirmedOrders.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No new orders
                    </div>
                  ) : (
                    confirmedOrders.map(order => renderOrderCard(order))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Preparing Column */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-orange-500">
                <Badge className="bg-orange-500 text-white text-lg px-3 py-1">
                  {preparingOrders.length}
                </Badge>
                <h2 className="font-bold text-xl">Preparing</h2>
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-3 pr-2">
                  {preparingOrders.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No orders in progress
                    </div>
                  ) : (
                    preparingOrders.map(order => renderOrderCard(order))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Ready Column */}
            <div className="flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-green-500">
                <Badge className="bg-green-500 text-white text-lg px-3 py-1">
                  {readyOrders.length}
                </Badge>
                <h2 className="font-bold text-xl">Ready to Serve</h2>
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-3 pr-2">
                  {readyOrders.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No orders ready
                    </div>
                  ) : (
                    readyOrders.map(order => renderOrderCard(order))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

