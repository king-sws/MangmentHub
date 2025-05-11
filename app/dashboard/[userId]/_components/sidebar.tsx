"use client";

import {
  LayoutDashboard, FolderKanban, Users, Calendar, BarChart3, Settings, Menu, Plus,
  Star, Laptop, ChevronRight, ChevronDown, LogOut
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import { getWorkspaces } from '@/actions/workspace';
import { Workspace } from '@prisma/client';
import { AddWorkspaceDialog } from "@/components/add-workspace-dialog";
import { WorkspaceActions } from '@/components/workspace-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { getEffectivePlan, getWorkspaceLimit } from '@/lib/plans';
import { PlanType } from '@/lib/plans';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

// A skeleton component for loading state
const WorkspaceSkeleton = () => (
  <div className="flex items-center justify-between py-2 px-3 rounded-md">
    <div className="flex items-center gap-2 flex-1">
      <Skeleton className="h-5 w-5 rounded" />
      <Skeleton className="h-4 w-28" />
    </div>
    <Skeleton className="h-6 w-6 rounded" />
  </div>
);

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
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2 px-3 rounded-md group transition-all hover:bg-primary/5",
        isActive ? "bg-primary/10 text-primary" : "text-gray-700"
      )}
    >
      <Link
        href={`/workspace/${workspace.id}`}
        className="flex items-center gap-2 text-sm flex-1 truncate"
      >
        <div className="bg-primary/10 text-primary p-1 rounded flex items-center justify-center">
          <FolderKanban className="h-4 w-4" />
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

  // Subscription state
  const [subscription, setSubscription] = useState<{
    plan: PlanType;
    planExpires: Date | null;
    workspaceLimit: number;
    canCreate: boolean;
  }>({
    plan: user.plan,
    planExpires: user.planExpires,
    workspaceLimit: getWorkspaceLimit(getEffectivePlan(user.plan, user.planExpires)),
    canCreate: true
  });

  // Create a function to fetch workspaces that can be called whenever needed
  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getWorkspaces();
      setWorkspaces(data);
      
      // Update subscription state with current plan information
      const effectivePlan = getEffectivePlan(user.plan, user.planExpires);
      const limit = getWorkspaceLimit(effectivePlan);
      
      setSubscription(prev => ({
        ...prev,
        plan: user.plan,
        planExpires: user.planExpires,
        workspaceLimit: limit,
        canCreate: data.length < limit
      }));
    } catch (error) {
      console.error('Failed to fetch workspaces', error);
    } finally {
      setIsLoading(false);
    }
  }, [user.plan, user.planExpires]);

  // Add workspace limit check
  useEffect(() => {
    const checkWorkspaceLimit = async () => {
      try {
        const currentWorkspaces = workspaces.length;
        const effectivePlan = getEffectivePlan(user.plan, user.planExpires);
        const limit = getWorkspaceLimit(effectivePlan);
        
        setSubscription(prev => ({
          ...prev,
          plan: user.plan,
          planExpires: user.planExpires,
          workspaceLimit: limit,
          canCreate: currentWorkspaces < limit
        }));
      } catch (error) {
        console.error('Failed to check workspace limit:', error);
      }
    };

    checkWorkspaceLimit();
  }, [workspaces.length, user.plan, user.planExpires]);

  // Function to refresh data after workspace actions
  const refreshWorkspaces = useCallback(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // This will force a refresh of the entire page
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const refreshSidebar = useCallback(() => {
    router.refresh();
    fetchWorkspaces();
  }, [router, fetchWorkspaces]);
  
  // Add a new workspace to state without refetching all workspaces
  const addWorkspace = useCallback((workspace: Workspace) => {
    setWorkspaces(prev => [workspace, ...prev]);
  }, []);

  // Initial fetch of workspaces
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const navigationLinks = [
    {
      href: `/dashboard/${user.id}`,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: `/dashboard/${user.id}/tasks`,
      label: 'My Tasks',
      icon: FolderKanban,
    },
    {
      href: `/dashboard/${user.id}/teams`,
      label: 'Team',
      icon: Users,
    },
    {
      href: `/dashboard/${user.id}/calendar`,
      label: 'Calendar',
      icon: Calendar,
    },
    {
      href: `/dashboard/${user.id}/analytics`,
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      href: `/dashboard/${user.id}/settings`,
      label: 'Settings',
      icon: Settings,
    },
  ];

  // Workspaces section header component
  const WorkspacesHeader = () => (
    <div 
      className="flex justify-between items-center mb-2 px-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer"
      onClick={() => setIsWorkspacesExpanded(!isWorkspacesExpanded)}
    >
      <div className="flex items-center gap-2">
        {isWorkspacesExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <span>Workspaces</span>
        <Badge variant="outline" className="border-primary/30 text-xs bg-primary/5 text-primary">
          {subscription.plan}
        </Badge>
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
              className="h-6 w-6 p-1 hover:bg-primary/10 hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                if (!subscription.canCreate) {
                  router.push('/settings/subscription');
                } else {
                  setIsAddDialogOpen(true);
                }
              }}
              disabled={!subscription.canCreate}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {subscription.canCreate ? "Add workspace" : "Upgrade to add more workspaces"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  // Empty workspaces state component
  const EmptyWorkspaceState = () => (
    <div className="text-sm text-gray-500 px-3 py-4 flex flex-col items-center justify-center space-y-2 border border-dashed rounded-md mx-1 bg-gray-50">
      {subscription.canCreate ? (
        <>
          <div className="p-2 bg-primary/10 rounded-full">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <p className="text-center">No workspaces yet</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-1 border-primary/20 text-primary hover:bg-primary/5"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Create workspace
          </Button>
        </>
      ) : (
        <Alert variant="destructive" className="p-3 text-xs">
          <div className="flex flex-col items-center space-y-2">
            <p>Workspace limit reached ({subscription.workspaceLimit})</p>
            <Link
              href="/settings/subscription"
              className="font-medium underline hover:text-primary"
            >
              Upgrade your plan
            </Link>
          </div>
        </Alert>
      )}
    </div>
  );

  // Calculate plan tier colors
  const getPlanColors = () => {
    switch (subscription.plan) {
      case 'FREE':
        return 'bg-gray-100 text-gray-700';
      case 'PRO':
        return 'bg-blue-100 text-blue-700';
      case 'BUSINESS':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header/Logo area */}
      <div className="h-16 flex items-center px-4 border-b">
        <Link href={`/dashboard/${user.id}`} className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center text-white shadow-sm">
            <Laptop className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">ManageHub</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-3">
        <nav className="space-y-1">
          {navigationLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 py-2 px-3 rounded-md transition-all hover:bg-gray-100',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-700 hover:text-gray-900'
                )}
              >
                <div className={cn(
                  "p-1 rounded",
                  isActive ? "bg-primary/10" : "bg-transparent"
                )}>
                  <link.icon className={cn(
                    "h-4 w-4",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <span className="text-sm">{link.label}</span>
              </Link>
            );
          })}

          {/* Workspaces section */}
          <div className="mt-8">
            <WorkspacesHeader />
            {isWorkspacesExpanded && (
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
                  // Show actual workspaces when loaded
                  workspaces.map((workspace) => {
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
                ) : (
                  // Show message when no workspaces are available
                  <EmptyWorkspaceState />
                )}
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* User Profile Area */}
      <div className="p-4 border-t mt-auto bg-gray-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="bg-primary text-white">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="outline" className={cn("text-xs px-2 py-0", getPlanColors())}>
                    {subscription.plan}
                  </Badge>
                  {subscription.planExpires && (
                    <span className="text-[0.7rem] text-muted-foreground">
                      Renews {format(new Date(subscription.planExpires), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => router.push(`/dashboard/${user.id}/profile`)}
            >
              <Users className="h-4 w-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => router.push('/settings/subscription')}
            >
              <Star className="h-4 w-4 mr-2" /> Subscription
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
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
          className="m-3 bg-white shadow-sm"
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
      <aside className="fixed left-0 top-0 hidden lg:block h-full w-64 border-r border-gray-200 bg-white z-40 shadow-sm">
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
        onWorkspaceCreated={(workspace) => {
          addWorkspace(workspace);
          setIsAddDialogOpen(false);
        }}
      />
    </>
  );
}