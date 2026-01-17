import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaasStore } from '@/store/saasStore';
import { UpdateUserLimitRequest } from '@/lib/api/saasApi';
import { formatCurrency } from '@/lib/utils';

interface UserLimitConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  tenantName?: string;
}

export function UserLimitConfigDialog({
  open,
  onOpenChange,
  tenantId,
  tenantName
}: UserLimitConfigDialogProps) {
  const { userLimits, fetchUserLimits, updateUserLimits } = useSaasStore();
  const [baseUsers, setBaseUsers] = useState<number>(10);
  const [extraRate, setExtraRate] = useState<number>(5000);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limitInfo = userLimits[tenantId];

  useEffect(() => {
    if (open && tenantId) {
      fetchUserLimits(tenantId);
    }
  }, [open, tenantId]);

  useEffect(() => {
    if (limitInfo) {
      setBaseUsers(limitInfo.baseIncludedUsers);
      setExtraRate(limitInfo.extraUserMonthlyRate);
    }
  }, [limitInfo]);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      const updateData: UpdateUserLimitRequest = {};
      if (baseUsers !== limitInfo?.baseIncludedUsers) {
        updateData.baseIncludedUsers = baseUsers;
      }
      if (extraRate !== limitInfo?.extraUserMonthlyRate) {
        updateData.extraUserMonthlyRate = extraRate;
      }

      await updateUserLimits(tenantId, updateData);
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update user limits');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate preview
  const currentUsers = limitInfo?.currentUserCount || 0;
  const extraUsers = Math.max(0, currentUsers - baseUsers);
  const monthlyCharge = extraUsers * extraRate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure User Limits</DialogTitle>
          <DialogDescription>
            {tenantName ? `Configure user limits for ${tenantName}` : 'Set base included users and extra user rates'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {limitInfo && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Current Users:</span>
                <span className="font-medium">{limitInfo.currentUserCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Remaining Slots:</span>
                <span className="font-medium">{limitInfo.remainingSlots}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseUsers">Base Included Users</Label>
              <Input
                id="baseUsers"
                type="number"
                min={limitInfo?.currentUserCount || 0}
                value={baseUsers}
                onChange={(e) => setBaseUsers(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Number of users included in the subscription. Cannot be less than current active users ({limitInfo?.currentUserCount || 0}).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="extraRate">Extra User Monthly Rate (KS)</Label>
              <Input
                id="extraRate"
                type="number"
                min={0}
                step={100}
                value={extraRate}
                onChange={(e) => setExtraRate(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Monthly charge per user beyond the base included users.
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 border rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Monthly Charge Preview</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Extra Users:</span>
                <span>{extraUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate per User:</span>
                <span>{formatCurrency(extraRate)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-semibold">
                <span>Monthly Charge:</span>
                <span>{formatCurrency(monthlyCharge)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !limitInfo}>
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
