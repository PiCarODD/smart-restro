import { useState } from 'react';
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
import { mockUsers } from '@/mock/data/users';
import { generateId, formatDate } from '@/lib/utils';

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

const roleConfig: Record<string, { label: string; color: string; canCreate: string[] }> = {
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700', canCreate: ['admin', 'manager', 'server', 'kitchen', 'cashier'] },
  manager: { label: 'Manager', color: 'bg-blue-100 text-blue-700', canCreate: ['server', 'kitchen', 'cashier'] },
  server: { label: 'Server', color: 'bg-green-100 text-green-700', canCreate: [] },
  kitchen: { label: 'Kitchen', color: 'bg-orange-100 text-orange-700', canCreate: [] },
  cashier: { label: 'Cashier', color: 'bg-purple-100 text-purple-700', canCreate: [] },
};

export function StaffManagement() {
  const { user: currentUser } = useAuthStore();
  
  // Mock staff data - in production, this would come from an API/store
  const [staff, setStaff] = useState<StaffMember[]>(
    mockUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      pin: u.pin,
      isActive: u.isActive !== false,
      createdAt: u.createdAt || new Date(),
    }))
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'server',
    pin: '',
    password: '',
    isActive: true,
  });

  // Check if current user can manage staff
  const currentUserRole = currentUser?.role || 'server';
  const canManageStaff = ['admin', 'manager'].includes(currentUserRole);
  const creatableRoles = roleConfig[currentUserRole]?.canCreate || [];

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const openCreateDialog = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: creatableRoles[0] || 'server',
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

  const handleSave = () => {
    if (!formData.name || !formData.email) return;
    
    if (editingStaff) {
      // Update existing staff
      setStaff(staff.map(s => 
        s.id === editingStaff.id 
          ? { ...s, ...formData }
          : s
      ));
    } else {
      // Create new staff
      const newStaff: StaffMember = {
        id: generateId(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        pin: formData.pin,
        isActive: formData.isActive,
        createdAt: new Date(),
      };
      setStaff([...staff, newStaff]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deletingStaff) {
      setStaff(staff.filter(s => s.id !== deletingStaff.id));
      setIsDeleteDialogOpen(false);
      setDeletingStaff(null);
    }
  };

  const toggleStaffStatus = (id: string) => {
    setStaff(staff.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    setFormData({ ...formData, pin });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!canManageStaff) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">
            Only Admins and Managers can manage staff members.
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
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {Object.entries(roleConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreateDialog}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Staff Creation Permissions</p>
              <p className="text-blue-600">
                As a <strong className="capitalize">{currentUserRole}</strong>, you can create: {' '}
                {creatableRoles.length > 0 
                  ? creatableRoles.map(r => roleConfig[r]?.label).join(', ')
                  : 'No roles (view only)'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>PIN</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
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
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setDeletingStaff(staffMember);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredStaff.length === 0 && (
          <div className="p-12 text-center">
            <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No staff members found</p>
          </div>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </DialogTitle>
            <DialogDescription>
              {editingStaff 
                ? 'Update the staff member details below.'
                : 'Create a new staff account. They will receive login credentials.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., John Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g., john@restaurant.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g., +95 9 123 456 789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
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
            <div className="space-y-2">
              <Label htmlFor="pin">Waiter App PIN (4 digits)</Label>
              <div className="flex gap-2">
                <Input
                  id="pin"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  placeholder="e.g., 1234"
                  maxLength={4}
                />
                <Button type="button" variant="outline" onClick={generatePin}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Used to log into the Waiter App on mobile devices
              </p>
            </div>
            {!editingStaff && (
              <div className="space-y-2">
                <Label htmlFor="password">Initial Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a password"
                />
                <p className="text-xs text-muted-foreground">
                  Staff should change this on first login
                </p>
              </div>
            )}
            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">Allow this user to log in</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingStaff ? 'Save Changes' : 'Create Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Staff Member {deletingStaff?.name || ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

