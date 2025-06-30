/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Clock,
  X,
  Eye,
  RotateCcw,
  Calendar,
  CreditCard,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';

// Type definitions
interface User {
  id?: string;
  name: string;
  email: string;
  plan?: string;
}

interface Refund {
  id: string;
  amount: number;
  reason: string;
  adminEmail: string;
  createdAt: string;
  status: string;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  user: User;
  stripeTransactionId?: string;
  paypalTransactionId?: string;
  refundAmount?: number;
  refunds: Refund[];
  description?: string;
  failureReason?: string;
}

interface Summary {
  totalRevenue: number;
  netRevenue: number;
  successRate: number | string;
  failedCount: number;
  completedCount?: number;
  refundCount?: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasPrev: boolean;
  hasNext: boolean;
}

interface Filters {
  page: number;
  limit: number;
  search: string;
  status: string;
  type: string;
  paymentMethod: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
  sortOrder: string;
}

type TransactionStatus = 
  | 'COMPLETED'
  | 'PENDING'
  | 'PROCESSING'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'DISPUTED';

type TransactionType = 
  | 'SUBSCRIPTION'
  | 'UPGRADE'
  | 'DOWNGRADE'
  | 'RENEWAL'
  | 'REFUND'
  | 'ONE_TIME_PAYMENT';

type PaymentMethod = 
  | 'STRIPE_CARD'
  | 'STRIPE_BANK'
  | 'PAYPAL'
  | 'APPLE_PAY'
  | 'GOOGLE_PAY';

const AdminTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 20,
    search: '',
    status: '',
    type: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('');
  const [processRefundLoading, setProcessRefundLoading] = useState<boolean>(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchTransactions();
    }
  }, [filters, mounted]);

  const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
      // Check multiple possible token storage locations
      return localStorage.getItem('adminToken') || 
             localStorage.getItem('authToken') ||
             localStorage.getItem('token') ||
             sessionStorage.getItem('adminToken') ||
             sessionStorage.getItem('authToken');
    }
    return null;
  };

  const fetchTransactions = async (): Promise<void> => {
    if (!mounted) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters, excluding empty values
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const token = getAuthToken();
      
      // Prepare headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add authentication - try multiple methods
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Also try admin key if available
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
      if (adminKey) {
        headers['x-admin-key'] = adminKey;
      }

      const url = `/api/admin/transactions?${queryParams.toString()}`;
      console.log('Fetching transactions from:', url);
      console.log('Headers:', headers);

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        setTransactions(data.data.transactions || []);
        setSummary(data.data.summary || null);
        setPagination(data.data.pagination || null);
        setError(null);
      } else {
        const errorMessage = data.message || data.error || `HTTP ${response.status}: Failed to fetch transactions`;
        console.error('API Error:', errorMessage);
        setError(errorMessage);
        
        // Reset data on error
        setTransactions([]);
        setSummary(null);
        setPagination(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      console.error('Fetch error:', error);
      setError(errorMessage);
      
      // Reset data on error
      setTransactions([]);
      setSummary(null);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string | number): void => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? Number(value) : 1
    }));
  };

  const handleRefund = async (): Promise<void> => {
    if (!selectedTransaction || !refundAmount || !refundReason) return;

    setProcessRefundLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const adminKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
      if (adminKey) {
        headers['x-admin-key'] = adminKey;
      }

      const response = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'refund',
          transactionId: selectedTransaction.id,
          amount: parseFloat(refundAmount),
          reason: refundReason,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowRefundModal(false);
        setRefundAmount('');
        setRefundReason('');
        setSelectedTransaction(null);
        await fetchTransactions(); // Refresh data
      } else {
        const errorMessage = data.message || data.error || 'Failed to process refund';
        setError(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      console.error('Refund error:', error);
      setError(errorMessage);
    } finally {
      setProcessRefundLoading(false);
    }
  };

  const getStatusVariant = (status: TransactionStatus): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<TransactionStatus, "default" | "secondary" | "destructive" | "outline"> = {
      COMPLETED: 'default',
      PENDING: 'secondary',
      PROCESSING: 'outline',
      FAILED: 'destructive',
      CANCELLED: 'secondary',
      REFUNDED: 'outline',
      PARTIALLY_REFUNDED: 'secondary',
      DISPUTED: 'destructive',
    };
    return variants[status] || 'secondary';
  };

  const getTypeVariant = (type: TransactionType): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<TransactionType, "default" | "secondary" | "destructive" | "outline"> = {
      SUBSCRIPTION: 'default',
      UPGRADE: 'default',
      DOWNGRADE: 'secondary',
      RENEWAL: 'outline',
      REFUND: 'destructive',
      ONE_TIME_PAYMENT: 'secondary',
    };
    return variants[type] || 'secondary';
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearFilters = (): void => {
    setFilters({
      page: 1,
      limit: 20,
      search: '',
      status: '',
      type: '',
      paymentMethod: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  // Don't render anything until mounted (prevents hydration issues)
  if (!mounted) {
    return null;
  }

  // Show error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500" />
            <h2 className="text-xl font-semibold text-foreground">Error Loading Transactions</h2>
            <p className="text-muted-foreground text-center max-w-md">{error}</p>
            <Button onClick={fetchTransactions} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading && !transactions.length) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-8 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 mb-2" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-4 sm:mb-0">
            Transaction Management
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button onClick={fetchTransactions} variant="default" disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800">{error}</p>
                <Button 
                  onClick={() => setError(null)} 
                  variant="ghost" 
                  size="sm"
                  className="ml-auto"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(summary.totalRevenue)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Net Revenue</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(summary.netRevenue)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold text-foreground">
                      {typeof summary.successRate === 'string' ? summary.successRate : summary.successRate.toFixed(2)}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Failed Transactions</p>
                    <p className="text-2xl font-bold text-foreground">
                      {summary.failedCount}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-4">
                <Filter className="w-5 h-5 mr-2" />
                Filters
                {showFilters ? (
                  <ChevronUp className="w-4 h-4 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-2" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="p-4 pt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="search"
                        placeholder="Email, ID, or description..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => handleFilterChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="REFUNDED">Refunded</SelectItem>
                        <SelectItem value="PARTIALLY_REFUNDED">Partially Refunded</SelectItem>
                        <SelectItem value="DISPUTED">Disputed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type Filter */}
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={filters.type}
                      onValueChange={(value) => handleFilterChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                        <SelectItem value="UPGRADE">Upgrade</SelectItem>
                        <SelectItem value="DOWNGRADE">Downgrade</SelectItem>
                        <SelectItem value="RENEWAL">Renewal</SelectItem>
                        <SelectItem value="REFUND">Refund</SelectItem>
                        <SelectItem value="ONE_TIME_PAYMENT">One-time Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Method Filter */}
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={filters.paymentMethod}
                      onValueChange={(value) => handleFilterChange('paymentMethod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Methods" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Methods</SelectItem>
                        <SelectItem value="STRIPE_CARD">Stripe Card</SelectItem>
                        <SelectItem value="STRIPE_BANK">Stripe Bank</SelectItem>
                        <SelectItem value="PAYPAL">PayPal</SelectItem>
                        <SelectItem value="APPLE_PAY">Apple Pay</SelectItem>
                        <SelectItem value="GOOGLE_PAY">Google Pay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom">From Date</Label>
                    <Input
                      id="dateFrom"
                      type="datetime-local"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateTo">To Date</Label>
                    <Input
                      id="dateTo"
                      type="datetime-local"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex justify-end">
                  <Button onClick={clearFilters} variant="ghost">
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Transactions {pagination && `(${pagination.totalCount} total)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <AlertCircle className="w-12 h-12 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground">No transactions found</h3>
                <p className="text-muted-foreground text-center">
                  Try adjusting your filters or check back later.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {transaction.id.slice(-8)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {transaction.stripeTransactionId || transaction.paypalTransactionId || 'Manual'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <User className="w-4 h-4 text-muted-foreground mr-2" />
                              <div>
                                <div className="font-medium">
                                  {transaction.user.name || 'N/A'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {transaction.user.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {formatCurrency(transaction.amount, transaction.currency)}
                              </div>
                              {(transaction.refundAmount ?? 0) > 0 && (
                                <div className="text-sm text-red-600">
                                  -{formatCurrency(transaction.refundAmount ?? 0, transaction.currency)} refunded
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(transaction.status)}>
                              {transaction.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTypeVariant(transaction.type)}>
                              {transaction.type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(transaction.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedTransaction(transaction)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {(transaction.status === 'COMPLETED' || transaction.status === 'PARTIALLY_REFUNDED') && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedTransaction(transaction);
                                    setShowRefundModal(true);
                                  }}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination && (
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
                      {pagination.totalCount} results
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev || loading}
                      >
                        Previous
                      </Button>
                      <span className="px-3 py-1 text-sm text-muted-foreground">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                        disabled={!pagination.hasNext || loading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>


        {/* Transaction Details Modal */}
        <Dialog open={selectedTransaction !== null && !showRefundModal} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>
            
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">ID</Label>
                    <p className="text-sm">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      <Badge variant={getStatusVariant(selectedTransaction.status)}>
                        {selectedTransaction.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Amount</Label>
                    <p className="text-sm">
                      {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Payment Method</Label>
                    <p className="text-sm">
                      {selectedTransaction.paymentMethod.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <p className="text-sm">
                    {selectedTransaction.user.name} ({selectedTransaction.user.email})
                  </p>
                </div>

                {selectedTransaction.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm">{selectedTransaction.description}</p>
                  </div>
                )}

                {selectedTransaction.failureReason && (
                  <div>
                    <Label className="text-sm font-medium">Failure Reason</Label>
                    <p className="text-sm text-red-600">{selectedTransaction.failureReason}</p>
                  </div>
                )}

                {selectedTransaction.refunds.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Refunds</Label>
                    <div className="space-y-2">
                      {selectedTransaction.refunds.map((refund) => (
                        <Card key={refund.id}>
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium">
                                  {formatCurrency(refund.amount, selectedTransaction.currency)}
                                </p>
                                <p className="text-xs text-muted-foreground">{refund.reason}</p>
                                <p className="text-xs text-muted-foreground">
                                  By: {refund.adminEmail} on {formatDate(refund.createdAt)}
                                </p>
                              </div>
                              <Badge variant={getStatusVariant(refund.status as TransactionStatus)}>
                                {refund.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm">{formatDate(selectedTransaction.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Updated</Label>
                    <p className="text-sm">{formatDate(selectedTransaction.updatedAt)}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>



        {/* Refund Modal */}
        <Dialog open={showRefundModal} onOpenChange={(open) => {
          if (!open) {
            setShowRefundModal(false);
            setRefundAmount('');
            setRefundReason('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Refund</DialogTitle>
              <DialogDescription>
                Enter the refund amount and reason below.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="refundAmount">Refund Amount</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedTransaction ? selectedTransaction.amount - (selectedTransaction.refundAmount || 0) : 0}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                />
                {selectedTransaction && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum: {formatCurrency(selectedTransaction.amount - (selectedTransaction.refundAmount || 0), selectedTransaction.currency)}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="refundReason">Reason</Label>
                <Textarea
                  id="refundReason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Reason for refund..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundAmount('');
                  setRefundReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRefund}
                disabled={!refundAmount || !refundReason || processRefundLoading}
                variant="destructive"
              >
                {processRefundLoading ? (
                  <span className="flex items-center">
                    <RotateCcw className="animate-spin mr-2" />
                    Processing...
                  </span>
                ) : (
                  'Process Refund'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminTransactionsPage;


