import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/lib/utils';

export function WaiterProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/waiter/login');
  };

  // Mock stats
  const stats = {
    todayOrders: 12,
    todaySales: 485.50,
    avgOrderTime: '8 min',
    shiftStart: '10:00 AM',
  };

  return (
    <div className="p-4 space-y-4">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-lg">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">{t('waiter.todaysPerformance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{stats.todayOrders}</div>
              <div className="text-xs text-muted-foreground">{t('waiter.ordersServed')}</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{formatCurrency(stats.todaySales)}</div>
              <div className="text-xs text-muted-foreground">{t('waiter.totalSales')}</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{stats.avgOrderTime}</div>
              <div className="text-xs text-muted-foreground">{t('waiter.avgOrderTime')}</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{stats.shiftStart}</div>
              <div className="text-xs text-muted-foreground">{t('waiter.shiftStarted')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-0">
          <button className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span>{t('waiter.settings')}</span>
          </button>
          <Separator />
          <button className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <span>{t('waiter.helpSupport')}</span>
          </button>
          <Separator />
          <button 
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>{t('nav.logout')}</span>
          </button>
        </CardContent>
      </Card>

      {/* App Info */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        <p>Smart Restaurant v1.0.0</p>
        <p>© 2024 All rights reserved</p>
      </div>
    </div>
  );
}

