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
  const socketInitializedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // Initialize Socket.IO connection and subscriptions when user is authenticated
  useEffect(() => {
    isMountedRef.current = true;
    const currentUserId = user?.id || null;
    
    // Only initialize if authenticated and user exists, and we haven't initialized for this user
    if (isAuthenticated && user && currentUserId && currentUserId !== userIdRef.current) {
      userIdRef.current = currentUserId;
      socketInitializedRef.current = true;
      
      // Initialize socket connection
      initSocket();
      
      // Initialize socket subscriptions
      // Note: Subscriptions will be active once socket connects
      // getSocket() in subscribeToOrders/Table will return the socket instance
      const orderUnsubscribe = initOrderSocketSubscriptions();
      const tableUnsubscribe = initTableSocketSubscriptions();
      
      unsubscribeRef.current = [orderUnsubscribe, tableUnsubscribe];
    }
    
    // Cleanup: only disconnect if user actually changed or component unmounts
    return () => {
      isMountedRef.current = false;
      const cleanupUserId = user?.id || null;
      
      // Only cleanup if:
      // 1. User is no longer authenticated, OR
      // 2. User ID changed (different user logged in)
      // Don't cleanup on React Strict Mode double-invoke (when user is still authenticated and same ID)
      if (!isAuthenticated || (cleanupUserId && cleanupUserId !== userIdRef.current)) {
        // Unsubscribe from all socket events
        unsubscribeRef.current.forEach(unsubscribe => {
          try {
            unsubscribe();
          } catch (error) {
            console.error('Error unsubscribing from socket:', error);
          }
        });
        unsubscribeRef.current = [];
        
        // Only disconnect socket if user is not authenticated
        // Don't disconnect on React Strict Mode double-invoke when user is still authenticated
        if (!isAuthenticated) {
          disconnectSocket();
          socketInitializedRef.current = false;
          userIdRef.current = null;
        } else if (cleanupUserId && cleanupUserId !== userIdRef.current) {
          // User changed, disconnect old socket
          disconnectSocket();
          socketInitializedRef.current = false;
        }
      }
    };
  }, [isAuthenticated, user?.id]); // Only depend on user.id, not the whole user object

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

