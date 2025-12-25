import { useTranslation } from 'react-i18next';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock notifications
const notifications = [
  {
    id: '1',
    type: 'ready',
    title: 'Order #142 Ready',
    message: 'Table 5 order is ready for pickup',
    time: '2 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'ready',
    title: 'Order #141 Ready',
    message: 'Table 3 order is ready for pickup',
    time: '5 min ago',
    read: false,
  },
  {
    id: '3',
    type: 'alert',
    title: 'Table 7 Waiting',
    message: 'Customer has been waiting 15+ minutes',
    time: '10 min ago',
    read: true,
  },
  {
    id: '4',
    type: 'info',
    title: 'Shift Started',
    message: 'Your shift has been logged',
    time: '1 hour ago',
    read: true,
  },
];

const typeConfig = {
  ready: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  alert: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
  info: { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-100' },
};

export function WaiterNotificationsPage() {
  const { t } = useTranslation();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('waiter.notifications')}</h1>
        {unreadCount > 0 && (
          <Badge variant="destructive">{unreadCount} {t('waiter.unread')}</Badge>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map(notification => {
          const config = typeConfig[notification.type as keyof typeof typeConfig];
          const Icon = config.icon;
          
          return (
            <Card 
              key={notification.id}
              className={notification.read ? 'opacity-60' : ''}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`p-2 rounded-full ${config.bg}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{notification.title}</p>
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

