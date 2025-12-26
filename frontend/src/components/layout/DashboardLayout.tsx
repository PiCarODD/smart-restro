import { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/authStore';
import { useRestaurantStore } from '@/store/restaurantStore';
import { initSocket, disconnectSocket } from '@/lib/socket';
import { initOrderSocketSubscriptions } from '@/store/orderStore';
import { initTableSocketSubscriptions } from '@/store/tableStore';

export function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const { loadRestaurant } = useRestaurantStore();
  const hasLoadedRestaurant = useRef(false);

  // Load restaurant data once when authenticated
  useEffect(() => {
    if (isAuthenticated && user && !hasLoadedRestaurant.current) {
      hasLoadedRestaurant.current = true;
      loadRestaurant();
    }
  }, [isAuthenticated, user, loadRestaurant]);

  // Track socket subscriptions cleanup functions
  const unsubscribeRef = useRef<(() => void)[]>([]);

  // Initialize Socket.IO connection and subscriptions when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      initSocket();
      
      // Initialize socket subscriptions
      // Note: Subscriptions will be active once socket connects
      // getSocket() in subscribeToOrders/Table will return the socket instance
      const orderUnsubscribe = initOrderSocketSubscriptions();
      const tableUnsubscribe = initTableSocketSubscriptions();
      
      unsubscribeRef.current = [orderUnsubscribe, tableUnsubscribe];
      
      // Cleanup: disconnect socket and unsubscribe when component unmounts or user logs out
      return () => {
        // Unsubscribe from all socket events
        unsubscribeRef.current.forEach(unsubscribe => unsubscribe());
        unsubscribeRef.current = [];
        // Disconnect socket
        disconnectSocket();
      };
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar 
          isCollapsed={isCollapsed} 
          onToggle={() => setIsCollapsed(!isCollapsed)} 
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

