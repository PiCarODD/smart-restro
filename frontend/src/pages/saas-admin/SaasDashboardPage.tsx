import { useEffect } from 'react';
import { useNavigationStore } from '@/store/navigationStore';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSaasStore } from '@/store/saasStore';
import { formatCurrency, formatDate } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  trial: { label: 'Trial', color: 'bg-blue-100 text-blue-700', icon: Clock },
  past_due: { label: 'Past Due', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const tierConfig: Record<string, { label: string; color: string }> = {
  starter: { label: 'Starter', color: 'bg-secondary text-secondary-foreground' },
  professional: { label: 'Professional', color: 'bg-purple-100 text-purple-700' },
  enterprise: { label: 'Enterprise', color: 'bg-amber-100 text-amber-700' },
};

export function SaasDashboardPage() {
  const { navigate } = useNavigationStore();
  const { stats, fetchStats, tenants, fetchTenants } = useSaasStore();

  useEffect(() => {
    fetchStats();
    fetchTenants({ page: 1 });
  }, [fetchStats, fetchTenants]);

  const recentTenants = tenants.slice(0, 5);
  const alertTenants = tenants.filter(t =>
    t.subscriptionStatus === 'past_due'
  ).slice(0, 3);

  if (!stats) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to SmartResto SaaS Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTenants}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeTenants} active, {stats.trialTenants} trial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Restaurants</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRestaurants}</div>
            <p className="text-xs text-muted-foreground">Across all tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active platform users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue (Est)</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.monthlyRevenue, 'USD')}
            </div>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +0% (Baseline)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* By Tier */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="text-foreground">Starter</span>
                </div>
                <span className="font-medium">{stats.byTier.starter || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-foreground">Professional</span>
                </div>
                <span className="font-medium">{stats.byTier.professional || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-foreground">Enterprise</span>
                </div>
                <span className="font-medium">{stats.byTier.enterprise || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle>Subscriptions by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-foreground">Active</span>
                </div>
                <span className="font-medium">{stats.byStatus.active || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-foreground">Trial</span>
                </div>
                <span className="font-medium">{stats.byStatus.trial || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-foreground">Past Due</span>
                </div>
                <span className="font-medium">{stats.byStatus.past_due || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-foreground">Cancelled</span>
                </div>
                <span className="font-medium">{stats.byStatus.cancelled || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alertTenants.length > 0 && (
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Attention Required
            </CardTitle>
            <CardDescription>
              Tenants that are Past Due (Showing up to 3)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertTenants.map((tenant: any) => {
                const status = statusConfig[tenant.subscriptionStatus] || statusConfig.active;
                const StatusIcon = status.icon;
                return (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between p-3 bg-accent/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground">{tenant.ownerEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                      <Button size="sm" variant="outline">
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Tenants</CardTitle>
            <CardDescription>
              Latest registered tenants
            </CardDescription>
          </div>
          <Button variant="outline" onClick={() => navigate('saas.tenants')}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {recentTenants.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No tenants found.</p>
          ) : (
            <div className="space-y-4">
              {recentTenants.map((tenant: any) => {
                const status = statusConfig[tenant.subscriptionStatus] || statusConfig.active;
                const tier = tierConfig[tenant.subscriptionTier] || tierConfig.starter;
                return (
                  <div
                    key={tenant.id}
                    className="flex items-center justify-between p-4 bg-accent/30 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">
                          {tenant.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-sm text-muted-foreground">{tenant.ownerEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden md:block">
                        <p className="text-sm">
                          {tenant.restaurants?.length || 0} restaurants
                        </p>
                        <p className="text-xs text-muted-foreground">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
