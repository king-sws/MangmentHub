'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createWorkspace } from '@/actions/workspace';
import { getWorkspaces } from '@/actions/getWorkspace';
import { getCurrentSubscription } from '@/actions/subscription';
import { getEffectivePlan, getWorkspaceLimit, PlanType } from '@/lib/plans';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Briefcase, 
  Users, 
  Sparkles, 
  Lock,
  Crown,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface SubscriptionData {
  plan: string;
  planExpires: Date | null;
}

interface WorkspaceData {
  id: string;
  name: string;
}

export default function CreateWorkspacePage() {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;
      
      try {
        const [subscription, workspaceList] = await Promise.all([
          getCurrentSubscription(),
          getWorkspaces()
        ]);
        
        setSubscriptionData(subscription);
        setWorkspaces(workspaceList);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load subscription data');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [session?.user?.id]);

  const effectivePlan = subscriptionData ? getEffectivePlan(subscriptionData.plan as PlanType, subscriptionData.planExpires) : 'Free';
  const workspaceLimit = getWorkspaceLimit(
    effectivePlan === 'Free' ? 'FREE' : effectivePlan
  );
  const currentWorkspaceCount = workspaces.length;
  const canCreateWorkspace = currentWorkspaceCount < workspaceLimit;
  const usagePercentage = workspaceLimit === Infinity ? 0 : (currentWorkspaceCount / workspaceLimit) * 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Workspace name is required');
      return;
    }
    
    if (!session?.user?.id) {
      toast.error('You must be signed in to create a workspace');
      return;
    }

    if (!canCreateWorkspace) {
      toast.error(`Your ${effectivePlan} plan allows up to ${workspaceLimit} workspaces`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const workspace = await createWorkspace({
        name: name.trim(),
      });
      
      toast.success("Your workspace has been created successfully!");
      
      // Force a cache invalidation
      router.refresh();
      
      // Navigate to the new workspace
      router.push(`/workspace/${workspace.id}`);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      toast.error("Failed to create workspace. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10">
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Loading workspace data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10">
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild className="group hover:bg-muted/80 transition-colors">
            <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
          </Button>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-xl">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Create New Workspace</h1>
                <p className="text-muted-foreground text-lg">
                  Set up a collaborative space for your team
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <Card className="border-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white dark:bg-gray-900 p-2 rounded-lg shadow-sm">
                  {effectivePlan === 'Free' ? (
                    <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Crown className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Workspace Usage
                  </CardTitle>
                  <CardDescription>
                    Your current plan: <Badge variant="outline" className="ml-1">{effectivePlan}</Badge>
                  </CardDescription>
                </div>
              </div>
              
              {!canCreateWorkspace && (
                <Button asChild variant="outline" className="bg-white/80 dark:bg-gray-900/80">
                  <Link href="/settings/subscription">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Workspaces used: {currentWorkspaceCount} of {workspaceLimit === Infinity ? '∞' : workspaceLimit}
              </span>
              <span className="font-medium">
                {workspaceLimit === Infinity ? '0%' : `${Math.round(usagePercentage)}%`}
              </span>
            </div>
            
            <Progress 
              value={usagePercentage} 
              className="h-2 bg-white/60 dark:bg-gray-800/60"
            />
            
            {!canCreateWorkspace && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Workspace Limit Reached
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Your {effectivePlan} plan allows up to {workspaceLimit} workspaces. 
                    Upgrade to create more workspaces.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Users className="h-6 w-6 text-indigo-600" />
                  Workspace Details
                </CardTitle>
                <CardDescription className="text-base">
                  Provide information about your new workspace
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-sm font-semibold text-foreground">
                        Workspace Name *
                      </label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Marketing Team Workspace"
                        disabled={isLoading || !canCreateWorkspace}
                        autoFocus
                        className="h-12 text-base border-2 focus:border-indigo-500 transition-colors"
                        maxLength={50}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          Choose a descriptive name for your workspace
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {name.length}/50
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isLoading}
                      className="flex-1 sm:flex-none h-12 px-8"
                    >
                      Cancel
                    </Button>
                    
                    <Button 
                      type="submit" 
                      disabled={isLoading || !name.trim() || !canCreateWorkspace}
                      className="flex-1 sm:flex-none h-12 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Create Workspace
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Features */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  What you get
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Unlimited boards per workspace',
                  'Team collaboration tools',
                  'Real-time updates',
                  'Task management',
                  'Member permissions'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-emerald-800 dark:text-emerald-200">{feature}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Plan Upgrade CTA */}
            {effectivePlan === 'Free' && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-600" />
                    Need more workspaces?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Upgrade to Pro or Premium for unlimited workspaces and advanced features.
                  </p>
                  <Button asChild className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                    <Link href="/settings/subscription">
                      View Plans
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}