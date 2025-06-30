/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// Table components implemented directly since they're not available
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Activity, 
  Shield, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Users,
  Server,
  AlertTriangle,
  Sun,
  Moon,
  RefreshCw,
  Settings,
  TrendingUp,
  Clock,
  User,
  MapPin,
  Monitor
} from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Types
interface AuditLog {
  id: string
  category: 'ADMIN' | 'USER' | 'SECURITY' | 'SUBSCRIPTION' | 'SYSTEM'
  event: string
  adminId?: string
  adminEmail?: string
  targetUserId?: string
  targetUserEmail?: string
  changes?: any
  createdAt: string
  ip?: string
  userAgent?: string
}

interface SecurityEvent {
  id: string
  event: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  ip?: string
  userAgent?: string
  details?: any
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface Stats {
  totalLogs?: number
  totalEvents?: number
  activityCounts: {
    last24Hours: number
    last7Days: number
    last30Days?: number
  }
  categoryBreakdown?: Array<{ category: string; count: number }>
  severityBreakdown?: Array<{ severity: string; count: number }>
  topEvents?: Array<{ event: string; count: number }>
  topAdmins?: Array<{ adminEmail: string; count: number }>
  topIPs?: Array<{ ip: string; count: number }>
}

interface Filters {
  search: string
  category: string
  severity: string
  startDate: string
  endDate: string
  limit: number
  page: number
}

const AuditLogsAdmin = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'security'>('audit')
  const [logs, setLogs] = useState<(AuditLog | SecurityEvent)[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [theme, setTheme] = useState('light')
  const [selectedLog, setSelectedLog] = useState<AuditLog | SecurityEvent | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    severity: '',
    startDate: '',
    endDate: '',
    limit: 25,
    page: 1
  })
  const [adminKey, setAdminKey] = useState('')

  // Fetch logs
  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        type: activeTab,
        page: filters.page.toString(),
        limit: filters.limit.toString(),
      })
      
      if (filters.search) params.append('search', filters.search)
      if (filters.category && activeTab === 'audit') params.append('category', filters.category)
      if (filters.severity && activeTab === 'security') params.append('severity', filters.severity)
      if (filters.startDate) params.append('startDate', new Date(filters.startDate).toISOString())
      if (filters.endDate) params.append('endDate', new Date(filters.endDate).toISOString())
      if (adminKey) params.append('adminKey', adminKey)
      
      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const data = await response.json()
      
      if (activeTab === 'audit') {
        setLogs(data.logs || [])
      } else {
        setLogs(data.events || [])
      }
      
      setPagination(data.pagination)
      setStats(data.stats)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs')
      setLogs([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  // Effect to fetch logs when filters change
  useEffect(() => {
    fetchLogs()
  }, [activeTab, filters.page, filters.limit])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.page !== 1) {
        setFilters(prev => ({ ...prev, page: 1 }))
      } else {
        fetchLogs()
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [filters.search, filters.category, filters.severity, filters.startDate, filters.endDate])

  const handleFilterChange = (key: keyof Filters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getCategoryVariant = (category: string) => {
    switch (category) {
      case 'ADMIN': return 'destructive'
      case 'SECURITY': return 'destructive'
      case 'USER': return 'default'
      case 'SYSTEM': return 'secondary'
      case 'SUBSCRIPTION': return 'outline'
      default: return 'default'
    }
  }

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive'
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'default'
      case 'LOW': return 'secondary'
      default: return 'outline'
    }
  }

  const exportLogs = () => {
    if (logs.length === 0) return
    
    const headers = activeTab === 'audit' 
      ? ['Timestamp', 'Category', 'Event', 'Admin Email', 'Target User', 'IP']
      : ['Timestamp', 'Event', 'Severity', 'IP', 'User Agent']
    
    const csvContent = [
      headers.join(','),
      ...logs.map(log => {
        if (activeTab === 'audit') {
          const auditLog = log as AuditLog
          return [
            `"${formatDate(auditLog.createdAt)}"`,
            auditLog.category,
            `"${auditLog.event}"`,
            auditLog.adminEmail || '',
            auditLog.targetUserEmail || '',
            auditLog.ip || ''
          ].join(',')
        } else {
          const securityEvent = log as SecurityEvent
          return [
            `"${formatDate(securityEvent.createdAt)}"`,
            `"${securityEvent.event}"`,
            securityEvent.severity,
            securityEvent.ip || '',
            `"${securityEvent.userAgent || ''}"`
          ].join(',')
        }
      })
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeTab}-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const StatCard = ({ icon: Icon, title, value, trend }: { 
    icon: any, 
    title: string, 
    value: number, 
    trend?: number 
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                +{trend}%
              </div>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )

  const LogDetailsDialog = ({ log }: { log: AuditLog | SecurityEvent }) => (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Log Details</DialogTitle>
        <DialogDescription>
          {formatDate(log.createdAt)}
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Event</label>
            <p className="text-sm">{log.event}</p>
          </div>
          
          {'category' in log && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <Badge variant={getCategoryVariant(log.category)}>{log.category}</Badge>
            </div>
          )}
          
          {'severity' in log && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Severity</label>
              <Badge variant={getSeverityVariant(log.severity)}>{log.severity}</Badge>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">IP Address</label>
            <p className="text-sm font-mono">{log.ip || 'N/A'}</p>
          </div>
        </div>
        
        {'adminEmail' in log && log.adminEmail && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Admin</label>
            <p className="text-sm font-mono">{log.adminEmail}</p>
          </div>
        )}
        
        {'targetUserEmail' in log && log.targetUserEmail && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Target User</label>
            <p className="text-sm font-mono">{log.targetUserEmail}</p>
          </div>
        )}
        
        {'userAgent' in log && log.userAgent && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">User Agent</label>
            <p className="text-sm break-all">{log.userAgent}</p>
          </div>
        )}
        
        {((log as AuditLog).changes || (log as SecurityEvent).details) && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              {activeTab === 'audit' ? 'Changes' : 'Details'}
            </label>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
              {JSON.stringify(
                activeTab === 'audit' ? (log as AuditLog).changes : (log as SecurityEvent).details, 
                null, 
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </DialogContent>
  )

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">Monitor system activity and security events</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="shrink-0"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchLogs}
              disabled={loading}
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={exportLogs} disabled={logs.length === 0} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Admin Key Configuration */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 flex items-center gap-2 text-sm">
              <Settings className="h-4 w-4" />
              Admin Key
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Input
              type="password"
              placeholder="Enter admin key for authenticated requests..."
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">Error loading audit logs</p>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchLogs} 
                className="mt-2"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard
              icon={Activity}
              title="Total Events"
              value={stats.totalLogs || stats.totalEvents || 0}
            />
            <StatCard
              icon={Clock}
              title="Last 24h"
              value={stats.activityCounts.last24Hours}
            />
            <StatCard
              icon={Calendar}
              title="Last 7 days"
              value={stats.activityCounts.last7Days}
            />
            
            {activeTab === 'security' && (
              <>
                <StatCard
                  icon={AlertTriangle}
                  title="Critical"
                  value={stats.severityBreakdown?.find(s => s.severity === 'CRITICAL')?.count || 0}
                />
                <StatCard
                  icon={Shield}
                  title="High Risk"
                  value={stats.severityBreakdown?.find(s => s.severity === 'HIGH')?.count || 0}
                />
              </>
            )}
            
            {activeTab === 'audit' && (
              <>
                <StatCard
                  icon={Users}
                  title="Admin Actions"
                  value={stats.categoryBreakdown?.find(c => c.category === 'ADMIN')?.count || 0}
                />
                <StatCard
                  icon={Server}
                  title="System Events"
                  value={stats.categoryBreakdown?.find(c => c.category === 'SYSTEM')?.count || 0}
                />
              </>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'audit' | 'security')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="audit" className="gap-2">
              <Activity className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security Events
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-9"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            {/* Category (Audit logs only) */}
            {activeTab === 'audit' && (
              <Select
                value={filters.category || 'all'}
                onValueChange={(value) => handleFilterChange('category', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="SECURITY">Security</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                  <SelectItem value="SYSTEM">System</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Severity (Security events only) */}
            {activeTab === 'security' && (
              <Select
                value={filters.severity || 'all'}
                onValueChange={(value) => handleFilterChange('severity', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Date Range */}
            <Input
              type="datetime-local"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full"
              placeholder="Start date"
            />
            <Input
              type="datetime-local"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full"
              placeholder="End date"
            />
          </div>

          {/* Limit Control */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Results per page:</label>
            <Select
              value={filters.limit.toString()}
              onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                {activeTab === 'audit' ? (
                  <>
                    <TableHead>Category</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Target User</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Event</TableHead>
                    <TableHead>Severity</TableHead>
                  </>
                )}
                <TableHead>IP Address</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: Math.min(5, filters.limit) }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={activeTab === 'audit' ? 7 : 5} 
                    className="text-center py-8 text-muted-foreground"
                  >
                    {error ? 'Failed to load logs' : 'No logs found'}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    {activeTab === 'audit' ? (
                      <>
                        <TableCell>
                          <Badge variant={getCategoryVariant((log as AuditLog).category)}>
                            {(log as AuditLog).category}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.event}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {(log as AuditLog).adminEmail || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {(log as AuditLog).targetUserEmail || '-'}
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="max-w-xs truncate">
                          {log.event}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityVariant((log as SecurityEvent).severity)}>
                            {(log as SecurityEvent).severity}
                          </Badge>
                        </TableCell>
                      </>
                    )}
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {log.ip || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        {selectedLog && <LogDetailsDialog log={selectedLog} />}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
              {pagination.totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-2 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Insights */}
      {stats && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Events */}
          {stats.topEvents && stats.topEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.topEvents.slice(0, 5).map((event, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm truncate">{event.event}</span>
                      <Badge variant="outline">{event.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Admins/IPs */}
          {((activeTab === 'audit' && stats.topAdmins) || (activeTab === 'security' && stats.topIPs)) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {activeTab === 'audit' ? 'Most Active Admins' : 'Top IP Addresses'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(activeTab === 'audit' ? stats.topAdmins : stats.topIPs)?.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-mono truncate">
                        {activeTab === 'audit' ? (item as any).adminEmail : (item as any).ip}
                      </span>
                      <Badge variant="outline">{(item as any).count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default AuditLogsAdmin