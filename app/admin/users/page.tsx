/* eslint-disable @typescript-eslint/no-unused-vars */
// app/admin/users/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, MoreVertical, User, Calendar, CreditCard, Shield, AlertCircle, Eye, Edit, Trash2, UserPlus, Download, RefreshCw, Settings, ChevronDown, Check, X, Mail, Phone, MapPin, Activity, Clock, DollarSign, TrendingUp, Users, Crown, Zap, ExternalLink, Key, LogOut } from 'lucide-react';

// shadcn/ui imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  plan: 'FREE' | 'PRO' | 'BUSINESS';
  planExpires: string | null;
  planStarted: string | null;
  planUpdated: string | null;
  role: 'USER' | 'ADMIN';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string | null;
  lastLogin: string | null;
  emailVerified: string | null;
  stats?: {
    workspaceCount: number;
    messageCount: number;
  };
}

interface UsersResponse {
  success: boolean;
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  metadata: {
    requestId: string;
    responseTime: number;
    queriedBy: string;
    timestamp: string;
  };
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  freeUsers: number;
  proUsers: number;
  businessUsers: number;
  newUsersThisMonth: number;
  revenue: number;
  churnRate: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Calculate real-time stats from actual user data
  const stats = useMemo(() => {
    if (!users.length) return null;
    
    const totalUsers = pagination.total;
    const freeUsers = users.filter(u => u.plan === 'FREE').length;
    const proUsers = users.filter(u => u.plan === 'PRO').length;
    const businessUsers = users.filter(u => u.plan === 'BUSINESS').length;
    
    // Calculate users with recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = users.filter(u => {
      const lastActivity = u.lastLogin ? new Date(u.lastLogin) : new Date(u.createdAt);
      return lastActivity > thirtyDaysAgo;
    }).length;

    // Calculate new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = users.filter(u => new Date(u.createdAt) >= startOfMonth).length;
    
    return {
      totalUsers,
      activeUsers,
      freeUsers,
      proUsers,
      businessUsers,
      newUsersThisMonth,
      // These would come from a separate financial API in production
      revenue: 0, // Placeholder - would need separate calculation
      churnRate: 0, // Placeholder - would need separate calculation
    };
  }, [users, pagination.total]);

  // Fetch users from your API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: searchTerm,
        plan: filterPlan,
        role: filterRole,
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      toast("Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, filterPlan, filterRole, sortBy, sortOrder]);

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get plan badge variant
  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'FREE': return { variant: 'secondary' as const, icon: User };
      case 'PRO': return { variant: 'default' as const, icon: Zap };
      case 'BUSINESS': return { variant: 'destructive' as const, icon: Crown };
      default: return { variant: 'secondary' as const, icon: User };
    }
  };

  // Get subscription status
  const getSubscriptionStatus = (user: User) => {
    if (user.plan === 'FREE') return { status: 'Free', variant: 'secondary' as const };
    
    if (!user.planExpires) return { status: 'Active', variant: 'default' as const };
    
    const expiryDate = new Date(user.planExpires);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return { status: 'Expired', variant: 'destructive' as const };
    if (daysUntilExpiry <= 7) return { status: `${daysUntilExpiry}d left`, variant: 'outline' as const };
    return { status: 'Active', variant: 'default' as const };
  };

  // Handle user actions
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }

      toast( "Success");
      
      await fetchUsers();
      setShowDeleteConfirm(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      toast("Error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user role');
      }

      toast("Success");

      await fetchUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user role';
      toast( "Error");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(users.map(user => user.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const handleExportUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast("Success");
    } catch (err) {
      toast( "Error");
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-3 w-[120px]" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage your users and their subscriptions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportUsers}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => fetchUsers()} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards - Only show if we have stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{stats.newUsersThisMonth}</span> this month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
              <Progress value={(stats.activeUsers / stats.totalUsers) * 100} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plan Distribution</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>PRO: {stats.proUsers}</span>
                  <span>Business: {stats.businessUsers}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Free: {stats.freeUsers}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{stats.newUsersThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                New users this month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={`${sortBy}-${sortOrder}`} 
                onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="lastLogin-desc">Last Login</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </span>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Bulk Edit
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users ({pagination.total.toLocaleString()})</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={selectedUsers.length === users.length ? clearSelection : selectAllUsers}>
                {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={selectedUsers.length === users.length ? clearSelection : selectAllUsers}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const planBadge = getPlanBadge(user.plan);
                const subscriptionStatus = getSubscriptionStatus(user);
                const PlanIcon = planBadge.icon;
                
                return (
                  <TableRow key={user.id} className={selectedUsers.includes(user.id) ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback>
                            {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || 'No Name'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {!user.emailVerified && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Unverified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={planBadge.variant} className="gap-1">
                        <PlanIcon className="h-3 w-3" />
                        {user.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={subscriptionStatus.variant}>
                        {subscriptionStatus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                        {user.role === 'ADMIN' && <Shield className="mr-1 h-3 w-3" />}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.lastLogin)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewUser(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUpdateUserRole(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                            disabled={actionLoading}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            {user.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {users.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Try adjusting your search criteria or filters to find the users you&#39;re looking for.
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage || loading}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!pagination.hasNextPage || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      

      {/* User Details Dialog */}
<Dialog open={showUserModal} onOpenChange={setShowUserModal}>
  <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
    <DialogHeader className="flex-shrink-0 pb-4 border-b">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={selectedUser?.image || undefined} />
            <AvatarFallback className="text-lg">
              {selectedUser?.name?.charAt(0)?.toUpperCase() || selectedUser?.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle className="text-xl font-semibold">
              {selectedUser?.name || 'Unnamed User'}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-1">
              <span>{selectedUser?.email}</span>
              {/* {!selectedUser?.emailVerified && (
                <Badge variant="outline" className="text-xs">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Unverified
                </Badge>
              )} */}
            </DialogDescription>
          </div>
        </div>
        <div className="flex items-center gap-2 pr-5">
          <Badge variant={selectedUser?.role === 'ADMIN' ? 'destructive' : 'secondary'}>
            {selectedUser?.role === 'ADMIN' && <Shield className="mr-1 h-3 w-3" />}
            {selectedUser?.role}
          </Badge>
          {(() => {
            if (!selectedUser) return null;
            const planBadge = getPlanBadge(selectedUser.plan);
            const PlanIcon = planBadge.icon;
            return (
              <Badge variant={planBadge.variant} className="gap-1">
                <PlanIcon className="h-3 w-3" />
                {selectedUser.plan}
              </Badge>
            );
          })()}
        </div>
      </div>
    </DialogHeader>

    <div className="flex-1 overflow-y-auto custom-scrollbar hide-scrollbar">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1  gap-6">
            {/* Essential Info */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">User ID</Label>
                    <p className="font-mono text-xs bg-muted px-2 py-1 rounded mt-1">
                      {selectedUser?.id}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Member Since</Label>
                    <p className="mt-1">{formatDate(selectedUser?.createdAt ?? null)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Login</Label>
                    <p className="mt-1">{formatDate(selectedUser?.lastLogin ?? null)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Updated</Label>
                    <p className="mt-1">{formatDate(selectedUser?.updatedAt ?? null)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Status */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Subscription Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Plan</span>
                  {(() => {
                    if (!selectedUser) return null;
                    const planBadge = getPlanBadge(selectedUser.plan);
                    const PlanIcon = planBadge.icon;
                    return (
                      <Badge variant={planBadge.variant} className="gap-1">
                        <PlanIcon className="h-3 w-3" />
                        {selectedUser.plan}
                      </Badge>
                    );
                  })()}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {(() => {
                    if (!selectedUser) return null;
                    const status = getSubscriptionStatus(selectedUser);
                    return <Badge variant={status.variant}>{status.status}</Badge>;
                  })()}
                </div>

                {selectedUser?.planExpires && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expires</span>
                    <span className="text-sm">{formatDate(selectedUser.planExpires)}</span>
                  </div>
                )}

                {selectedUser?.planStarted && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Started</span>
                    <span className="text-sm">{formatDate(selectedUser.planStarted)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Usage Stats - Only show if available */}
          {selectedUser?.stats && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-blue-600">{selectedUser.stats.workspaceCount}</div>
                    <div className="text-xs text-muted-foreground mt-1">Workspaces</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-green-600">{selectedUser.stats.messageCount}</div>
                    <div className="text-xs text-muted-foreground mt-1">Messages</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedUser.lastLogin 
                        ? Math.floor((new Date().getTime() - new Date(selectedUser.lastLogin).getTime()) / (1000 * 60 * 60 * 24))
                        : 'Never'
                      }
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Days Since Login</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.floor((new Date().getTime() - new Date(selectedUser?.createdAt ?? '').getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Days Active</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Billing Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Billing Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Current Plan</Label>
                      <p className="text-sm font-medium">{selectedUser?.plan}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Plan Started</Label>
                      <p className="text-sm">{formatDate(selectedUser?.planStarted ?? null)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Next Billing</Label>
                      <p className="text-sm">{formatDate(selectedUser?.planExpires ?? null)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Stripe Customer</Label>
                      {selectedUser?.stripeCustomerId ? (
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {selectedUser.stripeCustomerId}
                          </code>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`https://dashboard.stripe.com/customers/${selectedUser.stripeCustomerId}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not connected</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Subscription ID</Label>
                      {selectedUser?.stripeSubscriptionId ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono block mt-1">
                          {selectedUser.stripeSubscriptionId}
                        </code>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not applicable</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Billing Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedUser?.stripeCustomerId && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`https://dashboard.stripe.com/customers/${selectedUser.stripeCustomerId}`, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View in Stripe
                    </Button>
                  )}
                  <Button variant="outline" size="sm" disabled>
                    <Calendar className="mr-2 h-4 w-4" />
                    View Invoices
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Billing
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Security Status */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${selectedUser?.emailVerified ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-sm font-medium">Email Verification</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedUser?.emailVerified ? 'Email address is verified' : 'Email address needs verification'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={selectedUser?.emailVerified ? 'default' : 'destructive'}>
                      {selectedUser?.emailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Account Status</p>
                        <p className="text-xs text-muted-foreground">
                          Account is active and in good standing
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <div>
                        <p className="text-sm font-medium">Last Activity</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedUser?.lastLogin ? formatDate(selectedUser.lastLogin) : 'No recent activity'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {selectedUser?.lastLogin ? 'Recent' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Admin Actions */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Administrative Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start h-auto py-3"
                    onClick={() => {
                      if (selectedUser) {
                        handleUpdateUserRole(selectedUser.id, selectedUser.role === 'ADMIN' ? 'USER' : 'ADMIN');
                      }
                    }}
                    disabled={actionLoading}
                  >
                    <div className="flex items-center">
                      <Shield className="mr-3 h-4 w-4" />
                      <div className="text-left">
                        <div className="text-sm font-medium">
                          {selectedUser?.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Change user role permissions
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start h-auto py-3"
                    disabled
                  >
                    <div className="flex items-center">
                      <Mail className="mr-3 h-4 w-4" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Send Email</div>
                        <div className="text-[10px] text-muted-foreground">
                          Send notification or message
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start h-auto py-3"
                    disabled
                  >
                    <div className="flex items-center">
                      <Download className="mr-3 h-4 w-4" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Export Data</div>
                        <div className="text-[10px] text-muted-foreground">
                          Download user data export
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start h-auto py-3"
                    disabled
                  >
                    <div className="flex items-center">
                      <RefreshCw className="mr-3 h-4 w-4" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Refresh Data</div>
                        <div className="text-[10px] text-muted-foreground">
                          Sync with external services
                        </div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-destructive">Delete User Account</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Permanently delete this user account and all associated data. 
                        This action cannot be undone.
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowUserModal(false);
                      }}
                      disabled={actionLoading}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>

    {/* Footer Actions */}
    <div className="flex-shrink-0 flex justify-between items-center gap-3 pt-4 border-t">
      <Button variant="outline" onClick={() => setShowUserModal(false)}>
        Close
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled>
          <Edit className="mr-2 h-4 w-4" />
          Edit User
        </Button>
        {selectedUser?.stripeCustomerId && (
          <Button variant="outline" size="sm" asChild>
            <a 
              href={`https://dashboard.stripe.com/customers/${selectedUser.stripeCustomerId}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Stripe
            </a>
          </Button>
        )}
      </div>
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
}