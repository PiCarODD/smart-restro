import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockTenants, mockSaasStats } from '@/mock/data/tenants';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  trial: { label: 'Trial', color: 'bg-blue-100 text-blue-700', icon: Clock },
  past_due: { label: 'Past Due', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const tierConfig = {
  starter: { label: 'Starter', color: 'bg-slate-100 text-slate-700' },
  professional: { label: 'Professional', color: 'bg-purple-100 text-purple-700' },
  enterprise: { label: 'Enterprise', color: 'bg-amber-100 text-amber-700' },
};

export function SaasDashboardPage() {
  const recentTenants = mockTenants.slice(0, 5);
  const alertTenants = mockTenants.filter(t => 
    t.subscriptionStatus === 'past_due' || t.subscriptionStatus === 'trial'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Welcome to SmartResto SaaS Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{mockSaasStats.totalTenants}</div>
            <p className="text-xs text-slate-500">
              {mockSaasStats.activeTenants} active, {mockSaasStats.trialTenants} trial
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Restaurants</CardTitle>
            <Building2 className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{mockSaasStats.totalRestaurants}</div>
            <p className="text-xs text-slate-500">Across all tenants</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{mockSaasStats.totalUsers}</div>
            <p className="text-xs text-slate-500">Active platform users</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(mockSaasStats.monthlyRevenue, 'USD')}
            </div>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* By Tier */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Subscriptions by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-500" />
                  <span className="text-slate-300">Starter</span>
                </div>
                <span className="text-white font-medium">{mockSaasStats.byTier.starter}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-slate-300">Professional</span>
                </div>
                <span className="text-white font-medium">{mockSaasStats.byTier.professional}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-slate-300">Enterprise</span>
                </div>
                <span className="text-white font-medium">{mockSaasStats.byTier.enterprise}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* By Status */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Subscriptions by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-slate-300">Active</span>
                </div>
                <span className="text-white font-medium">{mockSaasStats.byStatus.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-slate-300">Trial</span>
                </div>
                <span className="text-white font-medium">{mockSaasStats.byStatus.trial}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-slate-300">Past Due</span>
                </div>
                <span className="text-white font-medium">{mockSaasStats.byStatus.past_due}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-slate-300">Cancelled</span>
                </div>
                <span className="text-white font-medium">{mockSaasStats.byStatus.cancelled}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alertTenants.length > 0 && (
        <Card className="bg-slate-800 border-slate-700 border-l-4 border-l-yellow-500">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Attention Required
            </CardTitle>
            <CardDescription className="text-slate-400">
              Tenants that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertTenants.map(tenant => {
                const status = statusConfig[tenant.subscriptionStatus];
                return (
                  <div 
                    key={tenant.id} 
                    className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                  >
                    <div>
                      <p className="text-white font-medium">{tenant.name}</p>
                      <p className="text-sm text-slate-400">{tenant.ownerEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={status.color}>
                        <status.icon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                      <Button size="sm" variant="outline" className="text-white border-slate-600">
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tenants */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Recent Tenants</CardTitle>
            <CardDescription className="text-slate-400">
              Latest registered tenants
            </CardDescription>
          </div>
          <Button variant="outline" className="text-white border-slate-600">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTenants.map(tenant => {
              const status = statusConfig[tenant.subscriptionStatus];
              const tier = tierConfig[tenant.subscriptionTier];
              return (
                <div 
                  key={tenant.id}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {tenant.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{tenant.name}</p>
                      <p className="text-sm text-slate-400">{tenant.ownerEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                      <p className="text-sm text-slate-300">
                        {tenant.restaurantCount} restaurants • {tenant.userCount} users
                      </p>
                      <p className="text-xs text-slate-500">
                        Joined {formatDate(tenant.createdAt)}
                      </p>
                    </div>
                    <Badge className={tier.color}>{tier.label}</Badge>
                    <Badge className={status.color}>{status.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

