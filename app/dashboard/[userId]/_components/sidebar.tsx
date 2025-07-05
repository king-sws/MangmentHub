/* eslint-disable react/no-unescaped-entities */
"use client";

import {
  FolderKanban, Users, Calendar, BarChart3, Settings, Menu, Plus,
  Star, Laptop, ChevronRight, ChevronDown, LogOut, Home, UserIcon
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import { getWorkspaces } from '@/actions/workspace';
import { checkSubscription } from '@/actions/checkSubscription';
import { Workspace } from '@prisma/client';
import { AddWorkspaceDialog } from "@/components/add-workspace-dialog";
import { WorkspaceActions } from '@/components/workspace-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { getEffectivePlan, getWorkspaceLimit } from '@/lib/plans';
import { PlanType } from '@/lib/plans';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from 'next-themes'; // Import useTheme hook
import Image from 'next/image';

interface DashboardSidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    plan: PlanType;
    planExpires: Date | null;
  };
}

// Define a more strict subscription type
interface SubscriptionState {
  plan: PlanType;
  planExpires: Date | null;
  workspaceLimit: number;
  canCreate: boolean;
  effectivePlan: PlanType;
  isActive: boolean;
}

// A skeleton component for loading state
const WorkspaceSkeleton = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md">
      <div className="flex items-center gap-2 flex-1">
        <Skeleton className={cn("h-5 w-5 rounded", isDark && "bg-gray-700")} />
        <Skeleton className={cn("h-4 w-28", isDark && "bg-gray-700")} />
      </div>
      <Skeleton className={cn("h-6 w-6 rounded", isDark && "bg-gray-700")} />
    </div>
  );
};

// A component for the workspace item
const WorkspaceItem = ({ 
  workspace, 
  isActive, 
  onAction 
}: { 
  workspace: Workspace; 
  isActive: boolean; 
  onAction: () => void;
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 px-3 rounded-md group transition-all",
        isActive 
          ? "bg-primary/10 text-primary dark:bg-primary/20" 
          : "text-gray-700 hover:bg-primary/5 dark:text-gray-300 dark:hover:bg-primary/10"
      )}
    >
      <Link
        href={`/workspace/${workspace.id}`}
        className="flex items-center gap-2 text-sm flex-1 truncate"
      >
        <div className={cn(
          "w-6 h-6 rounded-md flex items-center justify-center transition-colors", 
          isActive 
            ? "bg-primary/10 text-primary dark:bg-primary/20" 
            : cn(
                "bg-gray-100 text-gray-600 group-hover:bg-primary/5 group-hover:text-primary/80",
                isDark && "bg-gray-800 text-gray-400 group-hover:bg-primary/10"
              )
        )}>
          <FolderKanban className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
        </div>
        <span className={cn("truncate", isActive && "font-medium")}>{workspace.name}</span>
      </Link>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <WorkspaceActions 
          workspace={workspace} 
          onAction={onAction}
        />
      </div>
    </div>
  );
};

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWorkspacesExpanded, setIsWorkspacesExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Refs for auto-refresh
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTimeRef = useRef<number>(Date.now());
  
  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionState>({
    plan: user.plan,
    planExpires: user.planExpires,
    workspaceLimit: getWorkspaceLimit(getEffectivePlan(user.plan, user.planExpires)),
    canCreate: true,
    effectivePlan: getEffectivePlan(user.plan, user.planExpires),
    isActive: false
  });

  // Debug effect to monitor workspace state changes
  useEffect(() => {
    console.log("Workspaces state updated:", workspaces);
  }, [workspaces]);

  // Function to safely check subscription status
  const refreshSubscription = useCallback(async () => {
    try {
      const result = await checkSubscription();
      
      if (result.success) {
        // Type safety: ensure all required properties exist before updating state
        const effectivePlan = result.effectivePlan || user.plan;
        const isActive = result.isActive ?? false;
        
        setSubscription(prev => ({
          ...prev,
          plan: result.plan,
          planExpires: result.planExpires,
          workspaceLimit: result.workspaceLimit,
          effectivePlan: effectivePlan as PlanType, // Type assertion to ensure it's PlanType
          isActive: isActive,
          canCreate: workspaces.length < result.workspaceLimit
        }));
      }
    } catch (error) {
      console.error("Failed to check subscription:", error);
    }
  }, [workspaces.length, user.plan]);

  // Create a function to fetch workspaces that can be called whenever needed
  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getWorkspaces();
      setWorkspaces(data);
      
      // Now refresh subscription info to ensure it's up to date
      await refreshSubscription();
      
      // Update last refresh time
      lastRefreshTimeRef.current = Date.now();
    } catch (error) {
      console.error('Failed to fetch workspaces', error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshSubscription]);

  // Add workspace limit check
  useEffect(() => {
    const checkWorkspaceLimit = () => {
      const currentWorkspaces = workspaces.length;
      
      // Use the latest subscription data
      setSubscription(prev => ({
        ...prev,
        canCreate: currentWorkspaces < prev.workspaceLimit
      }));
    };

    checkWorkspaceLimit();
  }, [workspaces.length]);

  // Function to refresh data after workspace actions
  const refreshWorkspaces = useCallback(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Auto-refresh mechanism
  useEffect(() => {
    // Set up periodic refresh
    const setupRefreshTimer = () => {
      // Clear any existing timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      
      // Refresh data every 5 minutes (300000ms)
      refreshTimerRef.current = setInterval(() => {
        // Only refresh if the user hasn't manually refreshed in the last 4 minutes
        const timeSinceLastRefresh = Date.now() - lastRefreshTimeRef.current;
        if (timeSinceLastRefresh > 240000) { // 4 minutes in ms
          fetchWorkspaces();
        }
      }, 300000); // 5 minutes
    };
    
    setupRefreshTimer();
    
    // Clean up on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [fetchWorkspaces]);
  
  // Add a new workspace to state without refetching all workspaces
  const addWorkspace = useCallback((workspace: Workspace) => {
    setWorkspaces(prev => {
      console.log("Adding workspace to state:", workspace);
      // Make sure we're not adding duplicates 
      const exists = prev.some(w => w.id === workspace.id);
      if (exists) {
        return prev;
      }
      // Add the new workspace at the beginning of the array
      return [workspace, ...prev];
    });
  }, []);

  // Initial fetch of workspaces
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Filter workspaces by search query
  const filteredWorkspaces = workspaces.filter(workspace => 
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Clear search query
  const clearSearch = () => {
    setSearchQuery("");
  };

  const navigationLinks = [
    {
      href: `/dashboard/${user.id}`,
      label: 'Home',
      icon: Home,
      color: 'text-blue-500',
      darkColor: 'dark:text-blue-400',
      hoverColor: 'group-hover:text-blue-600',
      hoverDarkColor: 'dark:group-hover:text-blue-300',
      bgColor: 'bg-blue-50',
      darkBgColor: 'dark:bg-blue-900/30',
    },
    {
      href: `/dashboard/${user.id}/tasks`,
      label: 'Tasks',
      icon: FolderKanban,
      color: 'text-green-500',
      darkColor: 'dark:text-green-400',
      hoverColor: 'group-hover:text-green-600',
      hoverDarkColor: 'dark:group-hover:text-green-300',
      bgColor: 'bg-green-50',
      darkBgColor: 'dark:bg-green-900/30',
    },
    {
      href: `/dashboard/${user.id}/teams`,
      label: 'Team',
      icon: Users,
      color: 'text-purple-500',
      darkColor: 'dark:text-purple-400',
      hoverColor: 'group-hover:text-purple-600',
      hoverDarkColor: 'dark:group-hover:text-purple-300',
      bgColor: 'bg-purple-50',
      darkBgColor: 'dark:bg-purple-900/30',
    },
    {
      href: `/dashboard/${user.id}/calendar`,
      label: 'Calendar',
      icon: Calendar,
      color: 'text-amber-500',
      darkColor: 'dark:text-amber-400',
      hoverColor: 'group-hover:text-amber-600',
      hoverDarkColor: 'dark:group-hover:text-amber-300',
      bgColor: 'bg-amber-50',
      darkBgColor: 'dark:bg-amber-900/30',
    },
    {
      href: `/dashboard/${user.id}/analytics`,
      label: 'Analytics',
      icon: BarChart3,
      color: 'text-red-500',
      darkColor: 'dark:text-red-400',
      hoverColor: 'group-hover:text-red-600',
      hoverDarkColor: 'dark:group-hover:text-red-300',
      bgColor: 'bg-red-50',
      darkBgColor: 'dark:bg-red-900/30',
    },
    {
      href: `/dashboard/${user.id}/settings`,
      label: 'Settings',
      icon: Settings,
      color: 'text-gray-500',
      darkColor: 'dark:text-gray-400',
      hoverColor: 'group-hover:text-gray-600',
      hoverDarkColor: 'dark:group-hover:text-gray-300',
      bgColor: 'bg-gray-50',
      darkBgColor: 'dark:bg-gray-800/50',
    },
  ];

  // Workspaces section header component
  const WorkspacesHeader = () => (
    <div className="flex justify-between items-center mb-2 px-3">
      <div 
        className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase cursor-pointer transition-colors hover:text-primary dark:hover:text-primary"
        onClick={() => setIsWorkspacesExpanded(!isWorkspacesExpanded)}
      >
        {isWorkspacesExpanded ? (
          <ChevronDown className="h-3 w-3 transition-transform" />
        ) : (
          <ChevronRight className="h-3 w-3 transition-transform" />
        )}
        <span>Workspaces</span>
        
        <span className="text-primary font-bold">
          {workspaces.length}/{subscription.workspaceLimit === Infinity ? '∞' : subscription.workspaceLimit}
        </span>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 rounded-full p-1",
                subscription.canCreate 
                  ? "hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20" 
                  : "opacity-50 cursor-not-allowed"
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (subscription.canCreate) {
                  setIsAddDialogOpen(true);
                } else {
                  router.push('/settings/subscription');
                }
              }}
              disabled={!subscription.canCreate}
            >
              <Plus className="h-3.5 w-3.5 transition-transform hover:scale-110" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {subscription.canCreate ? "Create workspace" : "Upgrade to add more workspaces"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  // Empty workspaces state component
  const EmptyWorkspaceState = () => (
    <div className="text-sm text-gray-500 dark:text-gray-400 px-3 py-4 flex flex-col items-center justify-center space-y-2 border border-dashed dark:border-gray-700 rounded-md mx-1 bg-gray-50 dark:bg-gray-800/50">
      {subscription.canCreate ? (
        <>
          <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-full">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <p className="text-center text-xs">No workspaces created yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-1 border-primary/20 text-primary hover:bg-primary/5 dark:border-primary/30 dark:hover:bg-primary/10"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Create workspace
          </Button>
        </>
      ) : (
        <Alert variant="destructive" className="p-3">
          <AlertDescription className="text-xs">
            <div className="flex flex-col items-center space-y-2">
              <p>Workspace limit reached ({subscription.workspaceLimit})</p>
              <Link
                href="/settings/subscription"
                className="font-medium underline hover:text-primary"
              >
                Upgrade your plan
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  // Calculate plan tier colors
  const getPlanColors = () => {
    // Use the effective plan for colors
    if (isDark) {
      switch (subscription.effectivePlan) {
        case 'FREE':
          return 'bg-gray-800 text-gray-300 border-gray-700';
        case 'PRO':
          return 'bg-blue-900/30 text-blue-300 border-blue-800/50';
        case 'BUSINESS':
          return 'bg-purple-900/30 text-purple-300 border-purple-800/50';
        default:
          return 'bg-gray-800 text-gray-300 border-gray-700';
      }
    } else {
      switch (subscription.effectivePlan) {
        case 'FREE':
          return 'bg-gray-100 text-gray-700 border-gray-200';
        case 'PRO':
          return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'BUSINESS':
          return 'bg-purple-50 text-purple-700 border-purple-200';
        default:
          return 'bg-gray-100 text-gray-700 border-gray-200';
      }
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10">
      {/* Header/Logo area */}
      <div className="h-16 flex items-center px-4 border-b dark:border-gray-800">
        <Link href="/" className="inline-block">
              <div className="flex items-center space-x-2">
                <Image
                  src="/blutto-no.svg" 
                  alt="Blutto Logo" 
                  width={84} 
                  height={84}
                  className="dark:hidden " 
                />
                <Image 
                  src="/blutto-white-no.svg" 
                  alt="Blutto Logo" 
                  width={84} 
                  height={84}
                  className="hidden dark:block " 
                />
              </div>
            </Link>
      </div>
      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-6 hide-scrollbar">
        {/* Main Navigation */}
        <nav className="space-y-1 mt-2">
          {navigationLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 py-2 px-3 rounded-md transition-all group',
                  isActive
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center transition-all",
                  isActive 
                    ? `${link.bgColor} ${link.darkBgColor}` 
                    : "bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-gray-800"
                )}>
                  <link.icon className={cn(
                    "h-4 w-4 transition-transform group-hover:scale-110",
                    isActive 
                      ? "text-primary" 
                      : `${link.color} ${link.darkColor} ${link.hoverColor} ${link.hoverDarkColor}`
                  )} />
                </div>
                <span className="text-sm">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Workspaces section */}
        <div>
          <WorkspacesHeader />
          {isWorkspacesExpanded && (
            <>
              
              <div className="space-y-1 mt-2">
                {/* Show skeletons when loading */}
                {isLoading ? (
                  // Show 3 skeleton items while loading
                  <>
                    <WorkspaceSkeleton />
                    <WorkspaceSkeleton />
                    <WorkspaceSkeleton />
                  </>
                ) : workspaces.length > 0 ? (
                  filteredWorkspaces.length > 0 ? (
                    // Show filtered workspaces
                    filteredWorkspaces.map((workspace) => {
                      const isWorkspaceActive = pathname.includes(`/workspace/${workspace.id}`);
                      return (
                        <WorkspaceItem
                          key={workspace.id}
                          workspace={workspace}
                          isActive={isWorkspaceActive}
                          onAction={refreshWorkspaces}
                        />
                      );
                    })
                  ) : searchQuery ? (
                    // No results for search
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
                      No workspaces match "{searchQuery}"
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-1 h-6 px-2 text-primary text-xs hover:bg-primary/5 dark:hover:bg-primary/10"
                        onClick={clearSearch}
                      >
                        Clear
                      </Button>
                    </div>
                  ) : (
                    // Empty state (should never happen, but just in case)
                    <EmptyWorkspaceState />
                  )
                ) : (
                  // Show message when no workspaces are available
                  <EmptyWorkspaceState />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* User Profile Area */}
      <div className="p-3 border-t mt-auto bg-gray-50 dark:bg-gray-800/50 dark:border-gray-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Avatar className="h-9 w-9 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-all duration-300">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="bg-primary text-white">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-medium truncate dark:text-white">{user.name}</p>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className={cn("text-xs px-1.5 py-0 h-4", getPlanColors())}>
                    {subscription.effectivePlan}
                  </Badge>
                  {subscription.isActive && subscription.planExpires && (
                    <span className="text-[0.65rem] text-muted-foreground dark:text-gray-400 whitespace-nowrap">
                      Renews {format(new Date(subscription.planExpires), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-2 text-xs text-gray-500 dark:text-gray-400">
              {user.email}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer flex items-center"
              onClick={() => router.push(`/dashboard/${user.id}/profile`)}
            >
              <UserIcon className="h-4 w-4 mr-2" /> Profile 
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer flex items-center"
              onClick={() => router.push('/settings/subscription')}
            >
              <Star className="h-4 w-4 mr-2" /> Subscription
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-300 flex items-center"
              onClick={() => router.push('/logout')}
            >
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Button */}
      <div className="fixed top-0 left-0 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          className="m-3 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm hover:shadow transition-all duration-300"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-72 p-0" title="Sidebar">
          <div className="flex justify-end p-2 lg:hidden">
            <SheetClose asChild />
          </div>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden lg:block h-full w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-40 transition-colors duration-300">
        <SidebarContent />
      </aside>

      {/* Offset for Desktop */}
      <div className="hidden lg:block ml-64" />
      
      {/* Add Workspace Dialog */}
      <AddWorkspaceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        userId={user.id}
        canCreate={subscription.canCreate}
        onWorkspaceCreated={addWorkspace}
      />
    </>
  );
}