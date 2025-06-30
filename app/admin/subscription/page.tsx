/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  User, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Eye,
  Settings,
  Calendar,
  Activity,
  DollarSign,
  Crown,
  Building2,
  Zap,
  Clock,
  AlertCircle,
  Copy,
  RefreshCw
} from 'lucide-react';

interface UserDetails {
  id: string;
  name: string;
  email: string;
  plan: string;
  planExpires: string | null;
  planStarted: string | null;
  planUpdated: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  lastLogin: string | null;
  planStatus?: {
    active: boolean;
    expired: boolean;
    daysUntilExpiry: number | null;
    autoRenewing: boolean;
  };
  subscriptionHealth?: {
    status: string;
    lastSyncDate: string | null;
    requiresAttention: boolean;
  };
}

interface ApiResponse {
  success: boolean;
  user?: UserDetails;
  result?: {
    message: string;
    subscriptionId?: string;
    user?: UserDetails;
    operation?: any;
    performedBy?: string;
    timestamp?: string;
  };
  error?: string;
  code?: string;
  details?: Array<{ field: string; message: string }>;
  metadata?: {
    requestId: string;
    responseTime: number;
    version: string;
  };
}

export default function AdminSubscriptionPage() {
  const [userId, setUserId] = useState("");
  const [plan, setPlan] = useState<"FREE" | "PRO" | "BUSINESS">("FREE");
  const [adminKey, setAdminKey] = useState("");
  const [action, setAction] = useState<"update" | "sync" | "cancel" | "reactivate">("sync");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setResult(null);
    setError(null);
    setValidationErrors({});
  }, [action, userId, plan]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!adminKey.trim()) errors.adminKey = "Admin key is required";
    if (!userId.trim()) {
      errors.userId = "User ID is required";
    } else if (!/^[a-z0-9]{25}$/.test(userId.trim())) {
      errors.userId = "Invalid user ID format (should be 25 character CUID)";
    }
    if (action === "cancel" && !reason.trim()) errors.reason = "Reason is required for cancellation";
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const requestBody = {
        userId: userId.trim(),
        plan,
        action,
        adminKey: adminKey.trim(),
        ...(reason.trim() && { reason: reason.trim() }),
        sendNotification: true,
        prorationBehavior: "create_prorations" as const,
      };

      const response = await fetch('/api/admin/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const data: ApiResponse = await response.json();
      
      if (!response.ok) {
        if (data.details && data.details.length > 0) {
          const fieldErrors: Record<string, string> = {};
          data.details.forEach(detail => {
            fieldErrors[detail.field] = detail.message;
          });
          setValidationErrors(fieldErrors);
        }
        throw new Error(data.error || 'Operation failed');
      }
      
      setResult(data);
      if (userId.trim()) await fetchUserDetails();
      if (action === "update") setReason("");
      
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async () => {
    if (!userId.trim() || !adminKey.trim()) {
      setError("User ID and Admin Key are required");
      return;
    }
    
    if (!validateForm()) return;
    
    setFetchingUser(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        userId: userId.trim(),
        adminKey: adminKey.trim(),
        includeHistory: 'false',
      });
      
      const response = await fetch(`/api/admin/subscription?${params}`);
      const data: ApiResponse = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch user details');
      
      setUserDetails(data.user || null);
    } catch (err) {
      setError((err as Error).message);
      setUserDetails(null);
    } finally {
      setFetchingUser(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPlanConfig = (planName: string) => {
    switch (planName) {
      case 'FREE': 
        return {
          variant: 'outline' as const,
          icon: <User className="w-3 h-3" />,
          color: 'text-muted-foreground',
          bgColor: 'bg-card',
          borderColor: 'border-border'
        };
      case 'PRO': 
        return {
          variant: 'default' as const,
          icon: <Crown className="w-3 h-3" />,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        };
      case 'BUSINESS': 
        return {
          variant: 'secondary' as const,
          icon: <Building2 className="w-3 h-3" />,
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800'
        };
      default: 
        return {
          variant: 'outline' as const,
          icon: <User className="w-3 h-3" />,
          color: 'text-muted-foreground',
          bgColor: 'bg-card',
          borderColor: 'border-border'
        };
    }
  };

  const getStatusConfig = (status: string, active?: boolean, expired?: boolean) => {
    if (expired) {
      return {
        variant: 'destructive' as const,
        icon: <XCircle className="w-3 h-3" />,
        text: 'Expired',
        color: 'text-destructive'
      };
    }
    if (active) {
      return {
        variant: 'default' as const,
        icon: <CheckCircle className="w-3 h-3" />,
        text: 'Active',
        color: 'text-green-600 dark:text-green-400'
      };
    }
    if (status === 'healthy') {
      return {
        variant: 'default' as const,
        icon: <Zap className="w-3 h-3" />,
        text: 'Healthy',
        color: 'text-green-600 dark:text-green-400'
      };
    }
    return {
      variant: 'secondary' as const,
      icon: <AlertCircle className="w-3 h-3" />,
      text: 'Inactive',
      color: 'text-muted-foreground'
    };
  };

  const getActionButtonConfig = () => {
    switch (action) {
      case 'sync': 
        return {
          text: 'Sync Subscription',
          icon: <RefreshCw className="w-4 h-4" />,
          variant: 'default' as const
        };
      case 'update': 
        return {
          text: 'Update Plan',
          icon: <Settings className="w-4 h-4" />,
          variant: 'default' as const
        };
      case 'cancel': 
        return {
          text: 'Cancel Subscription',
          icon: <XCircle className="w-4 h-4" />,
          variant: 'destructive' as const
        };
      case 'reactivate': 
        return {
          text: 'Reactivate',
          icon: <CheckCircle className="w-4 h-4" />,
          variant: 'default' as const
        };
      default: 
        return {
          text: 'Execute',
          icon: <Settings className="w-4 h-4" />,
          variant: 'default' as const
        };
    }
  };

  const getDaysUntilExpiryConfig = (days: number) => {
    if (days <= 3) return { variant: 'destructive' as const, color: 'text-destructive' };
    if (days <= 7) return { variant: 'secondary' as const, color: 'text-orange-500 dark:text-orange-400' };
    if (days <= 30) return { variant: 'outline' as const, color: 'text-yellow-500 dark:text-yellow-400' };
    return { variant: 'outline' as const, color: 'text-green-600 dark:text-green-400' };
  };

  const actionConfig = getActionButtonConfig();

  return (
    <div className="min-h-screen text-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Subscription Management</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Manage user subscriptions and sync with payment providers
              </p>
            </div>
          </div>
        </div>

        {/* Security Warning */}
        <Alert className="mb-6 border-border bg-card shadow-sm">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning-foreground font-semibold">Administrator Access Required</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            This tool directly modifies user subscriptions and billing. All actions are logged, audited, and irreversible.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
          {/* Control Panel */}
          <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                <div className="p-2 rounded-lg bg-accent text-accent-foreground">
                  <Settings className="w-5 h-5" />
                </div>
                Control Panel
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Execute subscription operations and manage user plans
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4 md:space-y-6">
                {/* Admin Key */}
                <div className="space-y-2">
                  <Label htmlFor="adminKey" className="text-sm font-medium">
                    Admin API Key *
                  </Label>
                  <Input
                    id="adminKey"
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter your admin API key"
                    className={`transition-all duration-200 ${
                      validationErrors.adminKey 
                        ? 'border-destructive focus:border-destructive bg-destructive/10' 
                        : 'focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  {validationErrors.adminKey && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.adminKey}
                    </p>
                  )}
                </div>
                
                {/* User ID */}
                <div className="space-y-2">
                  <Label htmlFor="userId" className="text-sm font-medium">
                    User ID (CUID) *
                  </Label>
                  <Input
                    id="userId"
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter 25-character user CUID"
                    className={`font-mono text-sm transition-all duration-200 ${
                      validationErrors.userId 
                        ? 'border-destructive focus:border-destructive bg-destructive/10' 
                        : 'focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                  {validationErrors.userId && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationErrors.userId}
                    </p>
                  )}
                </div>
                
                {/* Action and Plan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="action" className="text-sm font-medium">
                      Action Type
                    </Label>
                    <Select value={action} onValueChange={(value: "update" | "sync" | "cancel" | "reactivate") => setAction(value)}>
                      <SelectTrigger className="focus:border-primary focus:ring-2 focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sync">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-primary" />
                            Sync Current
                          </div>
                        </SelectItem>
                        <SelectItem value="update">
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-green-600 dark:text-green-400" />
                            Update Plan
                          </div>
                        </SelectItem>
                        <SelectItem value="cancel">
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-destructive" />
                            Cancel Subscription
                          </div>
                        </SelectItem>
                        <SelectItem value="reactivate">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            Reactivate
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="plan" className="text-sm font-medium">
                      Target Plan
                    </Label>
                    <Select 
                      value={plan} 
                      onValueChange={(value: "FREE" | "PRO" | "BUSINESS") => setPlan(value)}
                      disabled={action === "sync" || action === "cancel"}
                    >
                      <SelectTrigger className={`focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                        (action === "sync" || action === "cancel") ? 'opacity-50' : ''
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREE">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            FREE
                          </div>
                        </SelectItem>
                        <SelectItem value="PRO">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            PRO
                          </div>
                        </SelectItem>
                        <SelectItem value="BUSINESS">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            BUSINESS
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Reason (for cancel action) */}
                {action === "cancel" && (
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium">
                      Cancellation Reason *
                    </Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Provide a detailed reason for cancellation"
                      className={`min-h-[80px] transition-all duration-200 ${
                        validationErrors.reason 
                          ? 'border-destructive focus:border-destructive bg-destructive/10' 
                          : 'focus:border-primary focus:ring-2 focus:ring-primary/20'
                      }`}
                    />
                    {validationErrors.reason && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {validationErrors.reason}
                      </p>
                    )}
                  </div>
                )}
                
                <Separator className="my-4 md:my-6" />
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || fetchingUser}
                    variant={actionConfig.variant}
                    className="flex-1 h-11 font-medium shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {actionConfig.icon}
                        <span className="ml-2">{actionConfig.text}</span>
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fetchUserDetails}
                    disabled={loading || fetchingUser || !userId.trim() || !adminKey.trim()}
                    className="h-11 px-4 shadow-sm border-border hover:bg-accent"
                  >
                    {fetchingUser ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Results */}
              {error && (
                <Alert className="mt-6 border-destructive/50 bg-destructive/10">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <AlertTitle className="text-destructive font-semibold">Operation Failed</AlertTitle>
                  <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
                </Alert>
              )}
              
              {result && result.success && (
                <Alert className="mt-6 border-success/50 bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertTitle className="text-success-foreground font-semibold">Success</AlertTitle>
                  <AlertDescription className="text-success-foreground">
                    <div className="space-y-2">
                      <p className="font-medium">{result.result?.message}</p>
                      {result.result?.subscriptionId && (
                        <div className="flex items-center gap-2 p-2 bg-success/20 rounded text-xs font-mono">
                          <span>ID: {result.result.subscriptionId}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 text-success hover:text-success-foreground"
                            onClick={() => copyToClipboard(result.result?.subscriptionId || '')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      {result.result?.performedBy && (
                        <p className="text-xs text-success">
                          Performed by: {result.result.performedBy}
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
          
          {/* User Details */}
          <Card className="shadow-lg border-border bg-card/80 backdrop-blur-sm h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                <div className="p-2 rounded-lg bg-accent text-accent-foreground">
                  <User className="w-5 h-5" />
                </div>
                User Information
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Detailed view of user account and subscription status
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-4 md:p-6">
              {userDetails ? (
                <div className="space-y-6 md:space-y-8">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      Basic Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start p-3 bg-card rounded-lg">
                        <span className="text-sm text-muted-foreground font-medium">Name</span>
                        <span className="text-sm font-semibold sm:text-right">{userDetails.name}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-start p-3 bg-card rounded-lg">
                        <span className="text-sm text-muted-foreground font-medium">Email</span>
                        <span className="text-sm font-semibold sm:text-right break-all">{userDetails.email}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-start p-3 bg-card rounded-lg">
                        <span className="text-sm text-muted-foreground font-medium">User ID</span>
                        <div className="flex items-center gap-2 sm:justify-end">
                          <span className="text-xs font-mono sm:text-right break-all">{userDetails.id}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => copyToClipboard(userDetails.id)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Subscription Info */}
                  <div>
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      Subscription Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-center p-3 bg-card rounded-lg">
                        <span className="text-sm text-muted-foreground font-medium">Current Plan</span>
                        <div className="flex items-center gap-2">
                          {getPlanConfig(userDetails.plan).icon}
                          <Badge variant={getPlanConfig(userDetails.plan).variant} className="font-medium">
                            {userDetails.plan}
                          </Badge>
                        </div>
                      </div>
                      
                      {userDetails.planStatus && (
                        <div className="flex flex-col sm:flex-row justify-between items-center p-3 bg-card rounded-lg">
                          <span className="text-sm text-muted-foreground font-medium">Status</span>
                          <div className="sm:text-right">
                            {(() => {
                              const config = getStatusConfig(
                                userDetails.subscriptionHealth?.status || '', 
                                userDetails.planStatus?.active, 
                                userDetails.planStatus?.expired
                              );
                              return (
                                <div className="flex items-center gap-2">
                                  {config.icon}
                                  <Badge variant={config.variant} className="font-medium">
                                    {config.text}
                                  </Badge>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start p-3 bg-card rounded-lg">
                        <span className="text-sm text-muted-foreground font-medium">Plan Expires</span>
                        <div className="sm:text-right">
                          <span className="text-sm font-semibold">
                            {userDetails.planExpires ? formatDate(userDetails.planExpires) : 'Never'}
                          </span>
                          {userDetails.planStatus?.daysUntilExpiry && (
                            <div className="mt-1">
                              {(() => {
                                const config = getDaysUntilExpiryConfig(userDetails.planStatus.daysUntilExpiry);
                                return (
                                  <Badge variant={config.variant} className="text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {userDetails.planStatus.daysUntilExpiry} days left
                                  </Badge>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-card rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Started</span>
                          <span className="text-sm font-semibold">
                            {formatDate(userDetails.planStarted)}
                          </span>
                        </div>
                        
                        <div className="p-3 bg-card rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Last Updated</span>
                          <span className="text-sm font-semibold">
                            {formatDate(userDetails.planUpdated)}
                          </span>
                        </div>
                      </div>
                      
                      {userDetails.planStatus?.autoRenewing !== undefined && (
                        <div className="flex flex-col sm:flex-row justify-between items-center p-3 bg-card rounded-lg">
                          <span className="text-sm text-muted-foreground font-medium">Auto-Renewal</span>
                          <Badge variant={userDetails.planStatus.autoRenewing ? 'default' : 'outline'} className="font-medium">
                            <div className="flex items-center gap-1">
                              {userDetails.planStatus.autoRenewing ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {userDetails.planStatus.autoRenewing ? 'Enabled' : 'Disabled'}
                            </div>
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Payment Integration */}
                  <div>
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400"></div>
                      Payment Integration
                    </h3>
                    <div className="space-y-3">
                      {userDetails.subscriptionHealth && (
                        <div className="flex flex-col sm:flex-row justify-between items-center p-3 bg-card rounded-lg">
                          <span className="text-sm text-muted-foreground font-medium">Health Status</span>
                          <div className="flex items-center gap-2">
                            {userDetails.subscriptionHealth.status === 'healthy' ? (
                              <Zap className="w-3 h-3 text-success" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-muted-foreground" />
                            )}
                            <Badge variant={userDetails.subscriptionHealth.status === 'healthy' ? 'default' : 'secondary'} className="font-medium">
                              {userDetails.subscriptionHealth.status === 'healthy' ? 'Healthy' : 'No Subscription'}
                            </Badge>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <div className="p-3 bg-card rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-muted-foreground font-medium">Stripe Customer ID</span>
                            {userDetails.stripeCustomerId && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => copyToClipboard(userDetails.stripeCustomerId || '')}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          <span className="text-sm font-mono break-all">
                            {userDetails.stripeCustomerId || (
                              <span className="text-muted-foreground italic">Not connected</span>
                            )}
                          </span>
                        </div>
                        
                        <div className="p-3 bg-card rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-muted-foreground font-medium">Stripe Subscription ID</span>
                            {userDetails.stripeSubscriptionId && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => copyToClipboard(userDetails.stripeSubscriptionId || '')}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          <span className="text-sm font-mono break-all">
                            {userDetails.stripeSubscriptionId || (
                              <span className="text-muted-foreground italic">Not connected</span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {userDetails.subscriptionHealth?.lastSyncDate && (
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-primary font-medium">Last Sync</span>
                            <span className="text-sm font-semibold text-primary-foreground">
                              {formatDate(userDetails.subscriptionHealth.lastSyncDate)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {userDetails.subscriptionHealth?.requiresAttention && (
                        <Alert className="border-warning/50 bg-warning/10">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          <AlertTitle className="text-warning-foreground text-sm">Attention Required</AlertTitle>
                          <AlertDescription className="text-warning-foreground text-sm">
                            This subscription requires manual review or intervention.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Account Info */}
                  <div>
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      Account Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-card rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-medium">Account Created</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatDate(userDetails.createdAt)}
                        </span>
                      </div>
                      
                      <div className="p-3 bg-card rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-medium">Last Login</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {userDetails.lastLogin ? formatDate(userDetails.lastLogin) : (
                            <span className="text-muted-foreground italic">Never</span>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {/* Account Age and Activity Indicators */}
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <span className="text-sm font-medium text-primary-foreground">Account Status</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-primary border-primary/50">
                            {(() => {
                              const daysSinceCreation = Math.floor(
                                (new Date().getTime() - new Date(userDetails.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                              );
                              if (daysSinceCreation < 30) return `${daysSinceCreation} days old`;
                              if (daysSinceCreation < 365) return `${Math.floor(daysSinceCreation / 30)} months old`;
                              return `${Math.floor(daysSinceCreation / 365)} years old`;
                            })()}
                          </Badge>
                          <Badge variant={userDetails.lastLogin ? 'default' : 'secondary'}>
                            {userDetails.lastLogin ? 'Active User' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 md:py-16">
                  <div className="relative">
                    <div className="mx-auto h-24 w-24 rounded-full bg-card flex items-center justify-center mb-6">
                      <User className="h-10 w-10 text-muted-foreground" />
                    </div>
                    {fetchingUser && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-24 w-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {fetchingUser ? 'Loading user data...' : 'No user selected'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {fetchingUser 
                      ? 'Please wait while we fetch the user information from the database.'
                      : 'Enter a valid user ID and admin key, then click "Check User" to view detailed account information.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Footer */}
        <div className="mt-8 md:mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Admin Panel v2.0 • All actions are logged and audited • 
            <span className="font-medium">Current Time: {new Date().toLocaleString()}</span>
          </p>
        </div>
      </div>
    </div>
  );
}