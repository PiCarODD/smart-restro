import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSaasStore } from '@/store/saasStore';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface UserBillingHistoryProps {
  tenantId: string;
  limit?: number;
}

export function UserBillingHistory({ tenantId, limit = 12 }: UserBillingHistoryProps) {
  const { billingHistory, fetchUserBilling, loading } = useSaasStore();
  const records = billingHistory[tenantId] || [];

  useEffect(() => {
    if (tenantId) {
      fetchUserBilling(tenantId, limit);
    }
  }, [tenantId, limit]);

  if (loading.stats) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Billing History</CardTitle>
        <CardDescription>Monthly billing records for extra users</CardDescription>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No billing records found
          </p>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {format(new Date(`${record.billingMonth}-01`), 'MMMM yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {record.extraUsersCount} extra user{record.extraUsersCount !== 1 ? 's' : ''} × {formatCurrency(record.ratePerUser)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed on {format(new Date(record.billedAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">
                    {formatCurrency(record.totalAmount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
