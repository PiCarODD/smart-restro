import { useTranslation } from 'react-i18next';
import { NavLink } from '@/components/router/NavLink';
import { useNavigationStore, PageName } from '@/store/navigationStore';
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
  Lock,
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
import { useSettingsStore } from '@/store/settingsStore';
import { User } from '@/types';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { currentPage } = useNavigationStore();
  const { logout, user } = useAuthStore();
  const { restaurant } = useRestaurantStore();
  const { orders } = useOrderStore();
  const { currentPlan } = useSettingsStore();
  const { t } = useTranslation();

  const navigation: Array<{
    title: string;
    page: PageName;
    icon: any;
    badgeKey?: string;
    feature?: string;
    roles: User['role'][];
  }> = [
    {
      title: t('nav.dashboard'),
      page: 'dashboard',
      icon: LayoutDashboard,
      roles: ['tenant_admin', 'admin', 'manager', 'waiter', 'server', 'cashier', 'cook', 'inventory'] as User['role'][],
    },
    {
      title: t('nav.orders'),
      page: 'orders',
      icon: ShoppingCart,
      badgeKey: 'activeOrders',
      roles: ['tenant_admin', 'admin', 'manager', 'waiter', 'server', 'cashier'] as User['role'][],
    },
    {
      title: t('nav.tables'),
      page: 'tables',
      icon: Users,
      roles: ['tenant_admin', 'admin', 'manager', 'waiter', 'server'] as User['role'][],
    },
    {
      title: t('nav.menu'),
      page: 'menu',
      icon: UtensilsCrossed,
      roles: ['tenant_admin', 'admin', 'manager', 'waiter', 'server', 'cashier', 'cook'] as User['role'][],
    },
    {
      title: t('nav.kds'),
      page: 'kds',
      icon: ChefHat,
      feature: 'kds',
      badgeKey: 'kdsOrders',
      roles: ['tenant_admin', 'admin', 'manager', 'cook'] as User['role'][],
    },
    {
      title: t('nav.inventory'),
      page: 'inventory',
      icon: Package,
      feature: 'inventory',
      roles: ['tenant_admin', 'admin', 'manager', 'inventory'] as User['role'][],
    },
    {
      title: t('nav.reports'),
      page: 'reports',
      icon: BarChart3,
      roles: ['tenant_admin', 'admin', 'manager'] as User['role'][],
    },
    {
      title: t('nav.settings'),
      page: 'settings',
      icon: Settings,
      roles: ['tenant_admin', 'admin', 'manager'] as User['role'][],
    },
  ];

  const getFeatureRequirement = (feature?: string) => {
    if (!feature) return null;
    const featureTierMap: Record<string, 'professional' | 'enterprise'> = {
      kds: 'professional',
      waiter_app: 'professional',
      inventory: 'professional',
      multi_location: 'enterprise',
    };
    return featureTierMap[feature] || null;
  };

  const isLocked = (feature?: string) => {
    const requiredTier = getFeatureRequirement(feature);
    if (!requiredTier) return false;

    const tierOrder = ['starter', 'professional', 'enterprise'];
    const currentTierIndex = tierOrder.indexOf(currentPlan);
    const requiredTierIndex = tierOrder.indexOf(requiredTier);

    return currentTierIndex < requiredTierIndex;
  };

  const isFeatureDisabled = (feature?: string) => {
    if (!feature || !restaurant) return false;
    const featureSettings = restaurant.settings.features[feature as keyof typeof restaurant.settings.features];
    return featureSettings?.enabled === false;
  };

  const hasRoleAccess = (roles?: User['role'][]) => {
    if (!roles || !user) return true;
    return roles.includes(user.role);
  };

  const filteredNavigation = navigation.filter(item =>
    !isFeatureDisabled(item.feature) && hasRoleAccess(item.roles)
  );

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
          <img
            src="/logos/SMART-restaurant.png"
            alt="SmartResto Logo"
            className="h-24 w-auto object-contain"
          />
        ) : (
          <img
            src="/logos/SMART-restaurant.gif"
            alt="SmartResto Logo"
            className="h-[120px] w-[160px] object-contain"
          />
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
            const isActive = currentPage === item.page;
            const badgeCount = getBadgeCount(item.badgeKey);
            const locked = isLocked(item.feature);

            const NavItem = (
              <NavLink
                key={item.page}
                to={item.page}
                onClick={(e) => locked && e.preventDefault()}
                disabled={locked}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  isCollapsed && "justify-center px-2",
                  locked && "opacity-60 cursor-not-allowed"
                )}
              >
                <div className="relative">
                  <item.icon className={cn("h-5 w-5", isCollapsed ? "" : "shrink-0")} />
                  {isCollapsed && badgeCount > 0 && !locked && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center">
                      {badgeCount}
                    </span>
                  )}
                  {isCollapsed && locked && (
                    <Lock className="absolute -top-1 -right-1 h-3 w-3 text-amber-500 fill-amber-500" />
                  )}
                </div>
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {locked && (
                      <Badge variant="outline" className="h-5 px-1 text-[10px] border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                        <Lock className="h-2.5 w-2.5 mr-1 fill-amber-500" />
                        Upgrade
                      </Badge>
                    )}
                    {badgeCount > 0 && !locked && (
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
                <Tooltip key={item.page} delayDuration={0}>
                  <TooltipTrigger asChild>
                    {NavItem}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div className="flex flex-col gap-1">
                      <span>{item.title} {badgeCount > 0 && !locked && `(${badgeCount})`}</span>
                      {locked && (
                        <span className="text-[10px] text-amber-500 font-bold uppercase">
                          Upgrade to {getFeatureRequirement(item.feature)}
                        </span>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return NavItem;
          })}
        </nav>
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

