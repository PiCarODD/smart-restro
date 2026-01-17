import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pencil,
  Trash2,
  Search,
  Shield,
  MoreHorizontal,
  UserPlus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuthStore } from '@/store/authStore';
import { usersApi, getApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  pin?: string;
  isActive: boolean;
  createdAt: Date;
}

export function StaffManagement() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();

  // Only allow these roles: admin, kitchen, cashier, manager
  const allowedRoles = ['admin', 'kitchen', 'cashier', 'manager'];
  
  const roleConfig: Record<string, { label: string; color: string; canCreate: string[] }> = {
    super_admin: { label: 'Super Admin', color: 'bg-red-100 text-red-700', canCreate: allowedRoles },
    tenant_admin: { label: 'Tenant Admin', color: 'bg-red-100 text-red-700', canCreate: allowedRoles },
    admin: { label: t('settings.roles.admin'), color: 'bg-red-100 text-red-700', canCreate: ['manager', 'cashier', 'kitchen'] },
    manager: { label: t('settings.roles.manager'), color: 'bg-blue-100 text-blue-700', canCreate: ['cashier', 'kitchen'] },
    cashier: { label: t('settings.roles.cashier'), color: 'bg-purple-100 text-purple-700', canCreate: [] },
    kitchen: { label: t('settings.roles.kitchen'), color: 'bg-orange-100 text-orange-700', canCreate: [] },
  };

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLimitError, setUserLimitError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);

  // Load staff on mount
  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await usersApi.list();
      const staffMembers: StaffMember[] = response.users.map(u => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        phone: u.phone,
        role: u.role,
        pin: u.pinCode,
        isActive: u.isActive,
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
      }));
      setStaff(staffMembers);
    } catch (err) {
      const apiError = getApiError(err);
      setError(apiError.message || 'Failed to load staff');
    } finally {
      setIsLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'cashier',
    pin: '',
    password: '',
    isActive: true,
  });

  // Check if current user can manage staff
  const currentUserRole = currentUser?.role || 'cashier';
  const canManageStaff = ['super_admin', 'tenant_admin', 'admin', 'manager'].includes(currentUserRole);
  const creatableRoles = roleConfig[currentUserRole]?.canCreate || [];

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const openCreateDialog = () => {
    setEditingStaff(null);
    setUserLimitError(null);
    setError(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: creatableRoles[0] || 'cashier',
      pin: '',
      password: '',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone || '',
      role: staffMember.role,
      pin: staffMember.pin || '',
      password: '',
      isActive: staffMember.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) return;
    if (!editingStaff && !formData.password) {
      setError(t('settings.passwordRequired'));
      return;
    }

    setError(null);
    try {
      const nameParts = formData.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || undefined; // Use undefined instead of empty string

      if (editingStaff) {
        // Update existing staff
        await usersApi.update(editingStaff.id, {
          email: formData.email,
          firstName,
          lastName,
          phone: formData.phone || undefined,
          role: formData.role,
          isActive: formData.isActive,
        });
      } else {
        // Create new staff
        await usersApi.create({
          email: formData.email,
          password: formData.password,
          firstName,
          lastName: lastName || firstName, // Use firstName if lastName is not provided
          phone: formData.phone || undefined,
          role: formData.role,
        });
      }

      // Reload staff list
      await loadStaff();
      setIsDialogOpen(false);
      setUserLimitError(null);
    } catch (err: any) {
      const apiError = getApiError(err);
      
      // Check if it's a user limit error (403)
      if (err?.response?.status === 403 && err?.response?.data?.error === 'User limit reached') {
        setUserLimitError(apiError.message || 'User limit reached. Contact SaaS admin to increase limit.');
        if (err?.response?.data?.limitInfo) {
          const limitInfo = err.response.data.limitInfo;
          setUserLimitError(
            `User limit reached. Current: ${limitInfo.currentUserCount}, Limit: ${limitInfo.totalAllowed}. ` +
            `Contact SaaS admin to increase your user limit.`
          );
        }
      } else {
        setError(apiError.message || 'Failed to save staff member');
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingStaff) return;

    setError(null);
    try {
      // Backend soft-deletes (deactivates) the user by setting isActive to false
      await usersApi.delete(deletingStaff.id);
      await loadStaff();
      setIsDeleteDialogOpen(false);
      setDeletingStaff(null);
    } catch (err) {
      const apiError = getApiError(err);
      setError(apiError.message || t('settings.failedToDeactivate'));
    }
  };

  const toggleStaffStatus = async (id: string) => {
    const staffMember = staff.find(s => s.id === id);
    if (!staffMember) return;

    setError(null);
    try {
      await usersApi.update(id, {
        isActive: !staffMember.isActive,
      });
      await loadStaff();
    } catch (err) {
      const apiError = getApiError(err);
      setError(apiError.message || 'Failed to update staff status');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!canManageStaff) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('settings.accessRestricted')}</h3>
          <p className="text-muted-foreground">
            {t('settings.onlyAdminsManagers')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('settings.searchStaff')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('settings.allRoles')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('settings.allRoles')}</SelectItem>
              {allowedRoles.map((role) => (
                <SelectItem key={role} value={role}>{roleConfig[role]?.label || role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreateDialog}>
          <UserPlus className="h-4 w-4 mr-2" />
          {t('settings.addStaff')}
        </Button>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">{t('settings.staffCreationPermissions')}</p>
              <p className="text-blue-600">
                {t('settings.asRoleYouCanCreate', {
                  role: currentUserRole,
                  roles: creatableRoles.length > 0
                    ? creatableRoles.map(r => roleConfig[r]?.label).join(', ')
                    : t('settings.noRoles')
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Staff Table */}
      <Card>
        {isLoading ? (
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('settings.loadingStaff')}</p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('settings.staffMember')}</TableHead>
                <TableHead>{t('settings.role')}</TableHead>
                <TableHead>{t('settings.contact')}</TableHead>
                <TableHead>{t('settings.pin')}</TableHead>
                <TableHead>{t('settings.status')}</TableHead>
                <TableHead>{t('settings.joined')}</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((staffMember) => (
                <TableRow key={staffMember.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {getInitials(staffMember.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{staffMember.name}</p>
                        <p className="text-sm text-muted-foreground">{staffMember.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={roleConfig[staffMember.role]?.color || 'bg-gray-100'}>
                      {roleConfig[staffMember.role]?.label || staffMember.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {staffMember.phone || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    {staffMember.pin ? (
                      <code className="px-2 py-1 bg-muted rounded text-sm">{staffMember.pin}</code>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={staffMember.isActive}
                      onCheckedChange={() => toggleStaffStatus(staffMember.id)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(staffMember.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(staffMember)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDeletingStaff(staffMember);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('settings.deactivateStaffMember')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStaff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t('settings.noStaffMembers')}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? t('settings.editStaffMember') : t('settings.addNewStaff')}
            </DialogTitle>
            <DialogDescription>
              {editingStaff
                ? t('settings.updateStaffDetails')
                : t('settings.createNewStaffAccount')
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* User Limit Warning */}
            {!editingStaff && userLimitError && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800 font-medium">User Limit Reached</p>
                <p className="text-xs text-yellow-700 mt-1">{userLimitError}</p>
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">{t('settings.fullName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('settings.emailAddress')} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g., john@restaurant.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t('settings.phoneNumber')}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g., +95 9 123 456 789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">{t('settings.role')} *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {creatableRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {roleConfig[role]?.label || role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editingStaff && (
              <div className="space-y-2">
                <Label htmlFor="password">{t('settings.initialPassword')} *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a password"
                />
                <p className="text-xs text-muted-foreground">
                  {t('settings.staffShouldChange')}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label>{t('settings.active')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.allowUserLogin')}</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!!userLimitError && !editingStaff}>
              {editingStaff ? t('settings.saveChanges') : t('settings.createStaff')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.deactivateStaffMember')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.deactivateStaffConfirm', { name: deletingStaff?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('settings.deactivateStaffMember')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

