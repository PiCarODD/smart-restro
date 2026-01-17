import { ReactNode } from 'react';
import { NavLink } from '@/components/router/NavLink';
import { useNavigationStore, PageName } from '@/store/navigationStore';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeftFromLine,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const navItems: Array<{ title: string; page: PageName; icon: any }> = [
  { title: 'Dashboard', page: 'saas.dashboard', icon: LayoutDashboard },
  { title: 'Tenants', page: 'saas.tenants', icon: Building2 },
  { title: 'All Users', page: 'saas.users', icon: Users },
  { title: 'Subscriptions', page: 'saas.subscriptions', icon: CreditCard },
];

interface SaasAdminLayoutProps {
  children: ReactNode;
}

export function SaasAdminLayout({ children }: SaasAdminLayoutProps) {
  const { navigate } = useNavigationStore();
  const { user, logout, impersonatedFromToken, stopImpersonating } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "relative flex flex-col border-r bg-card transition-all duration-300 z-50",
          isCollapsed ? "w-16" : "w-64",
          "hidden md:flex",
          isMobileMenuOpen && "fixed inset-y-0 left-0 flex md:relative"
        )}>
          {/* Logo */}
          <div className="flex h-16 items-center justify-center border-b px-4">
            {isCollapsed ? (
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SR</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">SR</span>
                </div>
                <div>
                  <h1 className="font-semibold text-sm leading-none">SmartResto</h1>
                  <p className="text-muted-foreground text-xs">SaaS Admin</p>
                </div>
              </div>
            )}
          </div>

          {/* Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border bg-background shadow-md hidden md:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
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
              {navItems.map((item) => {
                const { currentPage } = useNavigationStore.getState();
                const isActive = currentPage === item.page;
                
                const NavItem = (
                  <NavLink
                    key={item.page}
                    to={item.page}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      isCollapsed && "justify-center px-2"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isCollapsed ? "" : "shrink-0")} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </NavLink>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.page} delayDuration={0}>
                      <TooltipTrigger asChild>
                        {NavItem}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.title}
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
                <p className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
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
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Logout
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
            )}
          </div>

          {/* Bottom Section */}
          <div className={cn("p-4 border-t", isCollapsed && "hidden")}>
            <div className="text-xs text-muted-foreground">
              <p>SmartResto SaaS Platform</p>
              <p>Version 1.0.0</p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b bg-card px-6">
            {/* Left: Mobile Menu & Title */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="md:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">SR</span>
                </div>
                <span className="font-semibold">SaaS Admin</span>
              </div>
            </div>

            {/* Right: Impersonation Banner, Notifications, User Menu */}
            <div className="flex items-center gap-3">
              {/* Impersonation Banner */}
              {impersonatedFromToken && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopImpersonating}
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <ArrowLeftFromLine className="h-4 w-4 mr-2" />
                  Return to Admin
                </Button>
              )}

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user?.name ? getInitials(user.name) : 'SA'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm">{user?.name || 'Super Admin'}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.name}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('dashboard')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
