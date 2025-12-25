import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Bell, User, LogOut, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { cn } from '@/lib/utils';

export function WaiterLayout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { orders } = useOrderStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/waiter/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const readyOrdersCount = orders.filter(
    o => o.status === 'ready' && o.waiterId === user?.id
  ).length;

  const navItems = [
    { path: '/waiter', icon: Home, label: t('waiter.tables') },
    { path: '/waiter/orders', icon: ClipboardList, label: t('waiter.orders'), badge: readyOrdersCount },
    { path: '/waiter/notifications', icon: Bell, label: t('waiter.alerts') },
    { path: '/waiter/profile', icon: User, label: t('waiter.profile') },
  ];

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language || 'en';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{t('waiter.app')}</h1>
            {user && (
              <p className="text-xs text-muted-foreground">
                {user.firstName} {user.lastName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => handleLanguageChange('en')}
                  className={currentLanguage === 'en' ? 'bg-accent' : ''}
                >
                  English
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleLanguageChange('my')}
                  className={currentLanguage === 'my' ? 'bg-accent' : ''}
                >
                  မြန်မာ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/waiter/login'); }}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 relative",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                      variant="destructive"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

