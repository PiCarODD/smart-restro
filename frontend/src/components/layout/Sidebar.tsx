import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingCart, 
  ChefHat,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/authStore';
import { useRestaurantStore } from '@/store/restaurantStore';
import { useOrderStore } from '@/store/orderStore';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const { restaurant } = useRestaurantStore();
  const { orders } = useOrderStore();
  const { t } = useTranslation();

  const navigation = [
    {
      title: t('nav.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: t('nav.orders'),
      href: '/orders',
      icon: ShoppingCart,
      badgeKey: 'activeOrders',
    },
    {
      title: t('nav.tables'),
      href: '/tables',
      icon: Users,
    },
    {
      title: t('nav.menu'),
      href: '/menu',
      icon: UtensilsCrossed,
    },
    {
      title: t('nav.kds'),
      href: '/kds',
      icon: ChefHat,
      feature: 'kds',
      badgeKey: 'kdsOrders',
    },
    {
      title: t('nav.inventory'),
      href: '/inventory',
      icon: Package,
      feature: 'inventory',
    },
    {
      title: t('nav.reports'),
      href: '/reports',
      icon: BarChart3,
    },
    {
      title: t('nav.settings'),
      href: '/settings',
      icon: Settings,
    },
  ];

  const isFeatureEnabled = (feature?: string) => {
    if (!feature || !restaurant) return true;
    const featureSettings = restaurant.settings.features[feature as keyof typeof restaurant.settings.features];
    return featureSettings?.enabled ?? true;
  };

  const filteredNavigation = navigation.filter(item => isFeatureEnabled(item.feature));

  // Calculate badge counts
  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length;
  const kdsOrders = orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status)).length;
  
  const getBadgeCount = (badgeKey?: string): number => {
    if (!badgeKey) return 0;
    if (badgeKey === 'activeOrders') return activeOrders;
    if (badgeKey === 'kdsOrders') return kdsOrders;
    return 0;
  };

  return (
    <div 
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b px-4">
        {isCollapsed ? (
          <span className="text-2xl">🍽️</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="font-bold text-lg">SmartResto</span>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border bg-background shadow-md"
        onClick={onToggle}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href || 
                            location.pathname.startsWith(item.href + '/');
            const badgeCount = getBadgeCount(item.badgeKey);
            
            const NavItem = (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <div className="relative">
                  <item.icon className={cn("h-5 w-5", isCollapsed ? "" : "shrink-0")} />
                  {isCollapsed && badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center">
                      {badgeCount}
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {badgeCount > 0 && (
                      <Badge variant={isActive ? "secondary" : "destructive"} className="h-5 px-1.5">
                        {badgeCount}
                      </Badge>
                    )}
                  </>
                )}
              </NavLink>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    {NavItem}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.title} {badgeCount > 0 && `(${badgeCount})`}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavItem;
          })}
        </nav>

        {/* Waiter App Link */}
        <Separator className="my-4" />
        <div className="px-2">
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <a
                  href="/waiter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Smartphone className="h-5 w-5" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="right">
                {t('nav.openWaiterApp')}
              </TooltipContent>
            </Tooltip>
          ) : (
            <a
              href="/waiter"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Smartphone className="h-5 w-5" />
              <span className="flex-1">{t('nav.waiterApp')}</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t p-4">
        {!isCollapsed && user && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        )}
        <Separator className={cn("mb-3", isCollapsed && "hidden")} />
        
        {isCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full text-muted-foreground hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {t('nav.logout')}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
            {t('nav.logout')}
          </Button>
        )}
      </div>
    </div>
  );
}

