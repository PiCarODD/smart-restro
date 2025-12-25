import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/authStore';
import { useRestaurantStore } from '@/store/restaurantStore';

export function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { loadRestaurant } = useRestaurantStore();
  const navigate = useNavigate();

  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication status on mount
    checkAuth().then(() => {
      if (!isAuthenticated) {
        navigate('/login');
      } else {
        loadRestaurant();
      }
    });
  }, [navigate, loadRestaurant, checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

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

