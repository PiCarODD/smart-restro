import { useState } from 'react';
import { 
  Search, 
  Plus, 
  MoreHorizontal,
  Building2,
  Users,
  Eye,
  Pencil,
  Ban,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockTenants } from '@/mock/data/tenants';
import { formatDate } from '@/lib/utils';

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

export function TenantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  const filteredTenants = mockTenants.filter(tenant => {
    const matchesSearch = 
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.subscriptionStatus === statusFilter;
    const matchesTier = tierFilter === 'all' || tenant.subscriptionTier === tierFilter;
    return matchesSearch && matchesStatus && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenants</h1>
          <p className="text-slate-400">Manage all registered tenants</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Tenant
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{mockTenants.length}</p>
                <p className="text-sm text-slate-400">Total Tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {mockTenants.filter(t => t.subscriptionStatus === 'active').length}
                </p>
                <p className="text-sm text-slate-400">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {mockTenants.filter(t => t.subscriptionStatus === 'past_due').length}
                </p>
                <p className="text-sm text-slate-400">Past Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {mockTenants.filter(t => t.subscriptionStatus === 'trial').length}
                </p>
                <p className="text-sm text-slate-400">On Trial</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tenants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-slate-700/50">
              <TableHead className="text-slate-400">Tenant</TableHead>
              <TableHead className="text-slate-400">Subscription</TableHead>
              <TableHead className="text-slate-400">Usage</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Created</TableHead>
              <TableHead className="text-slate-400 w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.map((tenant) => {
              const status = statusConfig[tenant.subscriptionStatus];
              const tier = tierConfig[tenant.subscriptionTier];
              const StatusIcon = status.icon;
              
              return (
                <TableRow key={tenant.id} className="border-slate-700 hover:bg-slate-700/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
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
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge className={tier.color}>{tier.label}</Badge>
                      {tenant.subscriptionEndDate && (
                        <p className="text-xs text-slate-500">
                          Expires: {formatDate(tenant.subscriptionEndDate)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Building2 className="h-3 w-3" />
                        {tenant.restaurantCount}/{tenant.maxRestaurants} restaurants
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Users className="h-3 w-3" />
                        {tenant.userCount}/{tenant.maxUsers} users
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {formatDate(tenant.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Login as Tenant
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Ban className="mr-2 h-4 w-4" />
                          Suspend
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredTenants.length === 0 && (
          <div className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">No tenants found</p>
          </div>
        )}
      </Card>
    </div>
  );
}

