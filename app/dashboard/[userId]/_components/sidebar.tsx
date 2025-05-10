"use client";

import {
  LayoutDashboard, FolderKanban, Users, Calendar, BarChart3, Settings, Menu, Plus
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
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-4 w-24" />
    </div>
    <Skeleton className="h-6 w-6 rounded" />
  </div>
);

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(true); // Set loading to true before fetching
      const data = await getWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to fetch workspaces', error);
    } finally {
      setIsLoading(false); // Set loading to false when done
    }
  }, []);

  // Add workspace limit check
  useEffect(() => {
    const checkWorkspaceLimit = async () => {
      try {
        const currentWorkspaces = workspaces.length;
        const effectivePlan = getEffectivePlan(subscription.plan, subscription.planExpires);
        const limit = getWorkspaceLimit(effectivePlan);
        
        setSubscription(prev => ({
          ...prev,
          workspaceLimit: limit,
          canCreate: currentWorkspaces < limit
        }));
      } catch (error) {
        console.error('Failed to check workspace limit:', error);
      }
    };

    checkWorkspaceLimit();
  }, [workspaces.length, subscription.plan, subscription.planExpires]);

  // Function to refresh data after workspace actions
  const refreshWorkspaces = useCallback(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // This will force a refresh of the entire page
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const refreshSidebar = useCallback(() => {
    router.refresh();
    fetchWorkspaces(); // Also refresh workspaces directly
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
      href: `/dashboard/${user.id}/team`,
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
    <div className="flex justify-between items-center mb-2 px-3 text-xs font-semibold text-gray-400 uppercase">
      <div className="flex items-center gap-2">
        <span>Workspaces</span>
        <Badge variant="outline" className="border-primary/20 text-xs">
          {subscription.plan}
        </Badge>
        <span className="text-muted-foreground">
          {workspaces.length}/{subscription.workspaceLimit === Infinity ? '∞' : subscription.workspaceLimit}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 p-1"
        onClick={() => {
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
    </div>
  );

  // Empty workspaces state component
  const EmptyWorkspaceState = () => (
    <div className="text-sm text-gray-500 px-3 py-2">
      {subscription.canCreate ? (
        "No workspaces yet. Create one!"
      ) : (
        <Alert variant="destructive" className="p-2 text-xs">
          Workspace limit reached ({subscription.workspaceLimit}).{' '}
          <Link
            href="/settings/subscription"
            className="font-medium underline hover:text-primary"
          >
            Upgrade plan
          </Link>
        </Alert>
      )}
    </div>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header/Logo area */}
      <div className="h-16 flex items-center px-4 border-b">
        <Link href={`/dashboard/${user.id}`} className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center text-white shadow-sm">
            {user.name?.[0]?.toUpperCase() || 'M'}
          </div>
          <span className="font-semibold text-lg">ManageHub</span>
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
                  'flex items-center gap-3 py-2 px-3 rounded-md transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <link.icon className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="text-sm">{link.label}</span>
              </Link>
            );
          })}

          {/* Workspaces section */}
          <div className="mt-8">
            <WorkspacesHeader />
            <div className="space-y-1">
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
                    <div
                      key={workspace.id}
                      className={`flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-100 ${isWorkspaceActive ? "bg-gray-100" : ""}`}
                    >
                      <Link
                        href={`/workspace/${workspace.id}`}
                        className="flex items-center gap-2 text-sm flex-1 truncate"
                      >
                        <FolderKanban className="h-4 w-4" />
                        <span className="truncate">{workspace.name}</span>
                      </Link>

                      {/* Pass the refreshWorkspaces function to the WorkspaceActions component */}
                      <WorkspaceActions 
                        workspace={workspace} 
                        onAction={refreshWorkspaces}
                      />
                    </div>
                  );
                })
              ) : (
                // Show message when no workspaces are available
                <EmptyWorkspaceState />
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* User Profile Area */}
      <div className="p-4 border-t mt-auto bg-gray-50">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback className="bg-primary text-white">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="outline" className="text-xs border-primary/20">
                {subscription.plan}
              </Badge>
              {subscription.planExpires && (
                <span className="text-[0.7rem] text-muted-foreground">
                  Renews {format(new Date(subscription.planExpires), 'MMM d')}
                </span>
              )}
            </div>
          </div>
        </div>
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
        <SheetContent side="left" className="w-64 p-0" title="Sidebar">
          <div className="flex justify-end p-2 lg:hidden">
            <SheetClose asChild />
          </div>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden lg:block h-full w-64 border-r border-gray-200 bg-white z-40">
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