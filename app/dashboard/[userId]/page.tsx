/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/[userId]/page.tsx
import { getBoards } from "@/actions/getBoards";
import { getWorkspaces } from "@/actions/getWorkspace";
import { auth } from "@/auth";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { 
  CalendarDays, 
  LayoutDashboard, 
  PlusCircle, 
  ChevronRight, 
  Briefcase,
  CheckCircle2,
  BarChart3,
  Activity,
  Users,
  Calendar,
  ArrowRight,
  Award,
  Zap,
  Target,
  Clock,
  Star,
  RefreshCw,
  Crown,
  Shield,
} from "lucide-react";
import { getCurrentSubscription } from "@/actions/subscription";
import { getEffectivePlan, getWorkspaceLimit } from "@/lib/plans";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TasksTableMini } from "./_components/TasksTableMini";
import { CompletedTasksCount } from "@/components/tasks/CompletedTasksCount";
import { UpcomingTasksCount } from "@/components/tasks/UpcomingTasksCount";
import { CompletedTasksList } from "@/components/tasks/CompletedTasksList";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";

// Function to get initials from a name
function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

// Helper to get workspace color
function getWorkspaceColor(id: string): string {
const colors = [
  "from-sky-500 to-blue-600",       // Calm and corporate
  "from-teal-500 to-emerald-600",   // Fresh and confident
  "from-rose-400 to-rose-600",      // Elegant but subdued
  "from-amber-400 to-yellow-500",   // Warm but not overwhelming
  "from-violet-500 to-indigo-600",  // Deep and refined
  "from-slate-500 to-slate-700"     // Neutral, modern fallback
];

  
  const charSum = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[charSum % colors.length];
}

// Helper function to determine real board activity based on card activity
function getBoardActivityStatus(board: any) {
  const now = new Date();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Count recent card activity (cards created/updated in last 7 days)
  let recentCardActivity = 0;
  let veryRecentActivity = 0; // last 3 days
  
  if (board.lists && Array.isArray(board.lists)) {
    board.lists.forEach((list: any) => {
      if (list.cards && Array.isArray(list.cards)) {
        recentCardActivity += list.cards.length;
        
        // Count very recent activity (last 3 days)
        list.cards.forEach((card: any) => {
          const cardDate = new Date(card.updatedAt || card.createdAt);
          if (cardDate >= threeDaysAgo) {
            veryRecentActivity++;
          }
        });
      }
    });
  }

  // Check board-level updates
  const boardUpdatedRecently = board.updatedAt && new Date(board.updatedAt) >= threeDaysAgo;
  
  // Determine activity level based on card activity and board updates
  if (veryRecentActivity >= 2 || (recentCardActivity >= 5) || boardUpdatedRecently) {
    return {
      status: 'active',
      label: 'Active',
      description: `${recentCardActivity} recent updates`,
      color: 'green',
      showPulse: true
    };
  } else if (recentCardActivity >= 1 || (board.updatedAt && new Date(board.updatedAt) >= sevenDaysAgo)) {
    return {
      status: 'moderate',
      label: 'Recently Active', 
      description: `${recentCardActivity} recent updates`,
      color: 'yellow',
      showPulse: false
    };
  } else {
    const lastUpdate = board.updatedAt ? new Date(board.updatedAt) : new Date(board.createdAt);
    const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      status: 'inactive',
      label: 'Inactive',
      description: `${daysSinceUpdate} days ago`,
      color: 'gray',
      showPulse: false
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function DashboardPage({ params }: { params: { userId: string } }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, name: true },
  });
  
  const boards = await getBoards();
  const workspaces = await getWorkspaces();
  const daysAgo = workspaces.length > 0 
    ? Math.floor(
        (Date.now() - new Date(workspaces[0].updatedAt || Date.now()).getTime()) /
        (1000 * 60 * 60 * 24)
      )
    : 0;

  const recentBoards = boards.slice(0, 3);
  const subscription = await getCurrentSubscription();
  const effectivePlan = getEffectivePlan(subscription.plan, subscription.planExpires);
  const workspaceLimit = getWorkspaceLimit(effectivePlan);
  
  const stats = {
    totalBoards: boards.length,
    totalWorkspaces: workspaces.length,
    totalMembers: workspaces.map(w => w._count.members).reduce((a, b) => a + b, 0),
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen font-sans  ">
      <div className="w-full max-w-7xl mx-auto p-2 sm:p-6 md:p-8 space-y-12">
        {/* Welcome header */}
        <div className="w-full">
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/20 border border-indigo-200/50 dark:border-indigo-800/30 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              {/* User Greeting Section */}
              <div className="flex-grow space-y-3">
                <p className="text-sm text-indigo-600/70 dark:text-indigo-400/90 font-medium tracking-wide">
                  {today}
                </p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-900 dark:text-indigo-100 tracking-tight">
                  Welcome back, {session?.user?.name?.split(' ')[0] || "User"}
                </h1>
                <p className="text-indigo-600/80 dark:text-indigo-400/90 text-base md:text-lg">
                  Here&lsquo;s an overview of your workspaces and tasks
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild 
                  className="group p-3 border-indigo-300 dark:border-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-600 active:scale-95 transition-all"
                >
                  <Link href="/board/new" className="flex items-center">
                    <PlusCircle 
                      className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors" 
                      aria-label="New Board" 
                    />
                    New Board
                  </Link>
                </Button>

                <Button
                  size="sm"
                  asChild
                  className="group p-3 bg-indigo-600 dark:bg-indigo-700 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-95 transition-all"
                  disabled={stats.totalWorkspaces >= workspaceLimit}
                >
                  <Link 
                    href="/workspace/new" 
                    className={`flex items-center ${stats.totalWorkspaces >= workspaceLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <PlusCircle 
                      className="h-5 w-5 mr-2" 
                      aria-label="New Workspace" 
                    />
                    {stats.totalWorkspaces >= workspaceLimit ? (
                      "Workspace Limit Reached"
                    ) : (
                      "New Workspace"
                    )}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm text-muted-foreground ">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 dark:text-indigo-300 dark:bg-primary/900/40">
            {effectivePlan} Plan
          </Badge>
          <span>Workspaces: {stats.totalWorkspaces}/{workspaceLimit}</span>
          {stats.totalWorkspaces >= workspaceLimit && (
            <Link 
              href="/settings/subscription" 
              className="text-primary hover:underline flex items-center dark:text-indigo-300"
            >
              Upgrade Plan <ArrowRight className="h-4 w-4 ml-1" aria-label="Upgrade Plan" />
            </Link>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
  <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-100 to-white dark:from-blue-900/30 dark:to-background/80 group hover:shadow-xl transition-all">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400"></div>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
      <div className="rounded-full bg-blue-100 dark:bg-blue-800/50 p-2 group-hover:scale-110 transition-transform">
        <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-300" aria-label="Workspaces" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{stats.totalWorkspaces}</div>
      <div className="flex items-center mt-1">
        <Progress 
          value={(stats.totalWorkspaces / workspaceLimit) * 100} 
          className="h-1 bg-blue-100/50 dark:bg-blue-950/50 [&>div]:bg-blue-600 dark:[&>div]:bg-blue-400"
        />
        <span className="text-xs text-muted-foreground ml-2">
          {stats.totalWorkspaces}/{workspaceLimit}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        {effectivePlan} Plan · {
          workspaceLimit === Infinity 
            ? "Unlimited workspaces" 
            : `${workspaceLimit} workspace limit`
        }
      </p>
    </CardContent>
  </Card>
  
  <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-100 to-white dark:from-purple-900/30 dark:to-background/80 group hover:shadow-xl transition-all">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-purple-500 dark:from-purple-500 dark:to-purple-400"></div>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Project Boards</CardTitle>
      <div className="rounded-full bg-purple-200 dark:bg-purple-800/50 p-2 group-hover:scale-110 transition-transform">
        <LayoutDashboard className="h-4 w-4 text-purple-600 dark:text-purple-300" aria-label="Project Boards" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{stats.totalBoards}</div>
      <div className="flex items-center mt-1">
        <Progress value={Math.min(stats.totalBoards * 5, 100)} className="h-1 bg-purple-100/50 dark:bg-purple-950/50 [&>div]:bg-purple-600 dark:[&>div]:bg-purple-400" />
        <span className="text-xs text-muted-foreground ml-2">{Math.min(stats.totalBoards * 5, 100)}%</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Active project boards
      </p>
    </CardContent>
  </Card>
  
  <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-100 to-white dark:from-green-900/30 dark:to-background/80 group hover:shadow-xl transition-all">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-green-500 dark:from-green-500 dark:to-green-400"></div>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
      <div className="rounded-full bg-green-100 dark:bg-green-800/50 p-2 group-hover:scale-110 transition-transform">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-300" aria-label="Completed Tasks" />
      </div>
    </CardHeader>
    <CardContent>
      <Suspense fallback={<div className="text-2xl font-bold">--</div>}>
        <CompletedTasksCount userId={session.user.id} />
      </Suspense>
      <div className="flex items-center mt-1">
        <Progress value={65} className="h-1 bg-green-100/50 dark:bg-green-950/50 [&>div]:bg-green-600 dark:[&>div]:bg-green-400" />
        <span className="text-xs text-muted-foreground ml-2">65%</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Tasks successfully completed
      </p>
    </CardContent>
  </Card>
  
  <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-100 to-white dark:from-amber-900/30 dark:to-background/80 group hover:shadow-xl transition-all">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-500 dark:to-amber-400"></div>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Upcoming Tasks</CardTitle>
      <div className="rounded-full bg-amber-100 dark:bg-amber-800/50 p-2 group-hover:scale-110 transition-transform">
        <CalendarDays className="h-4 w-4 text-amber-600 dark:text-amber-300" aria-label="Upcoming Tasks" />
      </div>
    </CardHeader>
    <CardContent>
      <Suspense fallback={<div className="text-2xl font-bold">--</div>}>
        <UpcomingTasksCount userId={session.user.id} />
      </Suspense>
      <div className="flex items-center mt-1">
        <Progress value={38} className="h-1 bg-amber-100/50 dark:bg-amber-950/50 [&>div]:bg-amber-600 dark:[&>div]:bg-amber-400" />
        <span className="text-xs text-muted-foreground ml-2">38%</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Tasks due this week
      </p>
    </CardContent>
  </Card>
</div>

        {/* Main content tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:flex bg-muted/90 p-1 rounded-lg">
            <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-background">
              <BarChart3 className="h-4 w-4 mr-2 text-green-600" aria-label="Overview" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-md data-[state=active]:bg-background">
              <Calendar className="h-4 w-4 mr-2 text-cyan-600" aria-label="Tasks" />
              Tasks
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Recent boards section */}

{/* Recent boards section */}
<div className="space-y-6">
  {/* Header Section - Improved spacing and alignment */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 p-3 rounded-xl shadow-sm border border-purple-200/50 dark:border-purple-700/30">
        <LayoutDashboard className="h-6 w-6 text-purple-600 dark:text-purple-400" aria-label="Recent Boards" />
      </div>
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Recent Boards
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your most recently accessed project boards
        </p>
      </div>
    </div>
    
    {/* Action buttons - Better mobile layout */}
    <div className="flex items-center gap-2 flex-shrink-0">
      <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
        <RefreshCw className="h-4 w-4" />
        <span className="hidden sm:inline">Refresh</span>
      </button>
      <a 
        href="/boards" 
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all group"
      >
        <span>View all boards</span>
        <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
      </a>
    </div>
  </div>
  
  {/* Boards List - Enhanced cards with better spacing */}
  <div className="space-y-3">
    {recentBoards.length > 0 ? (
  recentBoards.map((board) => {
    const activityStatus = getBoardActivityStatus(board);
    
    const formatDate = (date: Date) => {
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return "Today";
      if (diffInDays === 1) return "Yesterday";
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const updatedDate = board.updatedAt ? new Date(board.updatedAt) : new Date(board.createdAt);

    return (
      <a key={board.id} href={`/board/${board.id}`} className="block">
        <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-200 hover:-translate-y-0.5">
          
          {/* Top accent line */}
          <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${getWorkspaceColor(board.workspace?.id || board.id)} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
          
          {/* Main content */}
          <div className="p-5">
            <div className="flex items-start gap-4">
              {/* Board icon */}
              <div className="relative flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border border-purple-200/50 dark:border-purple-700/30 group-hover:scale-105 transition-transform duration-200">
                  <LayoutDashboard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                {activityStatus.showPulse && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900">
                    <div className="h-full w-full bg-green-400 rounded-full animate-pulse" />
                  </div>
                )}
              </div>

              {/* Board info */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Title and status */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors truncate">
                    {board.title}
                  </h3>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    activityStatus.status === 'active' 
                      ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                      : activityStatus.status === 'moderate'
                      ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                  }`}>
                    {activityStatus.showPulse && <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
                    {activityStatus.status === 'moderate' && <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />}
                    {activityStatus.label}
                  </span>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Briefcase className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                    <span className="text-purple-600 dark:text-purple-400 font-medium truncate">
                      {board.workspace?.name || "No workspace"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      {formatDate(updatedDate)}
                    </span>
                  </div>
                  {activityStatus.description && activityStatus.status !== 'inactive' && (
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{activityStatus.description}</span>
                    </div>
                  )}
                </div>

                {/* Progress info */}
                {board._count?.lists !== undefined && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                      <Target className="h-3.5 w-3.5" />
                      <span>{board._count.lists} lists</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Arrow indicator */}
              <div className="flex-shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </a>
    );
  })
) : (
      /* Empty state - Cleaner and more focused */
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900 hover:border-purple-300/50 dark:hover:border-purple-600/50 transition-all duration-300 group">
        <div className="p-10 text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
            <LayoutDashboard className="h-8 w-8 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 transition-colors duration-300 relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-600/0 group-hover:from-purple-500/10 group-hover:to-purple-600/10 transition-all duration-300" />
          </div>
          
          {/* Content */}
          <div className="space-y-4 max-w-sm mx-auto">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                No boards yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                Create your first project board to start organizing tasks and collaborating with your team
              </p>
            </div>
            
            {/* CTA Button */}
            <div className="pt-2">
              <Link 
                href="/board/new" 
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
              >
                <PlusCircle className="h-4 w-4" />
                Create your first board
              </Link>
            </div>

            {/* Feature highlights - More compact */}
            <div className="pt-6">
  {/* First row - first two items */}
  <div className="flex justify-between gap-3">
    {[
      { icon: LayoutDashboard, label: 'Kanban', color: 'blue' },
      { icon: Users, label: 'Teams', color: 'green' },
    ].map(({ icon: Icon, label, color }) => (
      <div 
        key={label} 
        className={`flex-1 min-w-[calc(50%-0.75rem)] max-w-[calc(50%-0.75rem)]
          text-center p-3 rounded-lg 
          bg-gradient-to-br 
          from-${color}-50 to-${color}-100 
          dark:from-${color}-900/20 dark:to-${color}-800/20 
          border border-${color}-200/50 dark:border-${color}-700/30`}
      >
        <div className={`w-6 h-6 bg-${color}-500 rounded-lg flex items-center justify-center mx-auto mb-2`}>
          <Icon className="h-3 w-3 text-white" />
        </div>
        <p className={`text-xs font-medium text-${color}-700 dark:text-${color}-300`}>
          {label}
        </p>
      </div>
    ))}
  </div>
  
  {/* Second row - centered third item */}
  <div className="flex justify-center mt-3">
    {(() => {
      const { icon: Icon, label, color } = { icon: Award, label: 'Progress', color: 'amber' };
      return (
        <div 
          className={`min-w-[calc(50%-0.75rem)] max-w-[calc(50%-0.75rem)]
            text-center p-3 rounded-lg 
            bg-gradient-to-br 
            from-${color}-50 to-${color}-100 
            dark:from-${color}-900/20 dark:to-${color}-800/20 
            border border-${color}-200/50 dark:border-${color}-700/30`}
        >
          <div className={`w-6 h-6 bg-${color}-500 rounded-lg flex items-center justify-center mx-auto mb-2`}>
            <Icon className="h-3 w-3 text-white" />
          </div>
          <p className={`text-xs font-medium text-${color}-700 dark:text-${color}-300`}>
            {label}
          </p>
        </div>
      );
    })()}
  </div>
</div>
          </div>
        </div>
      </div>
    )}
  </div>
</div>

                {/* Workspaces section - Professional redesign */}
<div className="space-y-6">
  {/* Header Section - Consistent with recent boards */}
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 p-3 rounded-xl shadow-sm border border-blue-200/50 dark:border-blue-700/30">
        <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-label="Workspaces" />
      </div>
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Your Workspaces
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Collaborate and organize with your teams
        </p>
      </div>
    </div>
    
    {/* Action buttons */}
    <div className="flex items-center gap-2 flex-shrink-0">
      
      <Link 
        href="/workspaces" 
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all group"
      >
        <span>View all workspaces</span>
        <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  </div>
  
  {/* Workspaces Grid */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    {workspaces.length > 0 ? (
      workspaces.map((workspace) => {
        const formatDate = (date: Date) => {
          const now = new Date();
          const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffInDays === 0) return "Today";
          if (diffInDays === 1) return "Yesterday";
          if (diffInDays < 7) return `${diffInDays} days ago`;
          if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };

        const updatedDate = workspace.updatedAt ? new Date(workspace.updatedAt) : new Date(workspace.createdAt);
        const isActive = daysAgo <= 2;

        return (
          <Link key={workspace.id} href={`/workspace/${workspace.id}`} className="block">
            <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 hover:-translate-y-0.5">
              
              {/* Top accent line */}
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${getWorkspaceColor(workspace.id)} transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
              
              {/* Main content */}
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Workspace avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border border-blue-200/50 dark:border-blue-700/30 group-hover:scale-105 transition-transform duration-200">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {getInitials(workspace.name)}
                      </span>
                    </div>
                    
                    
                  </div>

                  {/* Workspace info */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Title and member count */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors truncate">
                        {workspace.name}
                      </h3>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        <Users className="h-3 w-3" />
                        {workspace._count.members}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <LayoutDashboard className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {workspace._count.boards} boards
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="whitespace-nowrap">
                          {formatDate(updatedDate)}
                        </span>
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-1.5">
                          <Activity className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar - Optional: shows boards vs capacity */}
                    {workspace._count.boards > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((workspace._count.boards / 10) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {workspace._count.boards}/{workspaceLimit} boards
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  <div className="flex-shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200">
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })
    ) : (
      
      <div className="lg:col-span-2">
        <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900 hover:border-blue-300/50 dark:hover:border-blue-600/50 transition-all duration-300 group">
          <div className="p-10 text-center">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
              <Briefcase className="h-8 w-8 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors duration-300 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/10 group-hover:to-blue-600/10 transition-all duration-300" />
            </div>
            
            {/* Content */}
            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {stats.totalWorkspaces >= workspaceLimit ? "Workspace Limit Reached" : "No workspaces yet"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  {stats.totalWorkspaces >= workspaceLimit 
                    ? `Your ${effectivePlan} plan allows up to ${workspaceLimit} workspaces. Upgrade to create more.`
                    : "Create your first workspace to start collaborating with your team and organizing projects"
                  }
                </p>
              </div>
              
              {/* CTA Button */}
              <div className="pt-2">
                {stats.totalWorkspaces >= workspaceLimit ? (
                  <a 
                    href="/settings/subscription"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    <Crown className="h-4 w-4" />
                    Upgrade Plan
                  </a>
                ) : (
                  <Link 
                    href="/workspace/new"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Create your first workspace
                  </Link>
                )}
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-3 gap-3 pt-6">
                {[
                  { icon: Users, label: 'Teams', color: 'blue' },
                  { icon: Shield, label: 'Secure', color: 'green' },
                  { icon: Zap, label: 'Fast', color: 'amber' }
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className={`text-center p-3 rounded-lg bg-gradient-to-br from-${color}-50 to-${color}-100 dark:from-${color}-900/20 dark:to-${color}-800/20 border border-${color}-200/50 dark:border-${color}-700/30`}>
                    <div className={`w-6 h-6 bg-${color}-500 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <p className={`text-xs font-medium text-${color}-700 dark:text-${color}-300`}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
              </div>

              {/* Right column - Profile and tasks */}
              <div className="space-y-6">
  <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-lg dark:shadow-2xl overflow-hidden">
    <div className="relative bg-gradient-to-r from-gray-100 to-gray-50 dark:from-zinc-800 dark:to-zinc-900 h-24">
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
        <Avatar className="h-24 w-24 border-4 border-white dark:border-zinc-800 shadow-md dark:shadow-xl">
          {user?.image ? (
            <AvatarImage 
              src={user.image} 
              alt={user.name || "User"} 
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="text-3xl bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-200 font-medium">
              {getInitials(user?.name)}
            </AvatarFallback>
          )}
        </Avatar>
      </div>
    </div>
    <CardContent className="flex flex-col items-center text-center pt-12 pb-5">
      <h3 className="font-medium text-lg text-gray-900 dark:text-white">{session?.user?.name || "User"}</h3>
      <p className="text-sm text-muted-foreground dark:text-zinc-400 mt-1">{session?.user?.email || ""}</p>
      <div className="flex items-center gap-4 mt-4">
        <div className="flex flex-col items-center">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalBoards}</span>
          <span className="text-xs text-muted-foreground dark:text-zinc-400">Boards</span>
        </div>
        <div className="h-10 w-px bg-border dark:bg-zinc-700"></div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalWorkspaces}</span>
          <span className="text-xs text-muted-foreground dark:text-zinc-400">Workspaces</span>
        </div>
        <div className="h-10 w-px bg-border dark:bg-zinc-700"></div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalMembers}</span>
          <span className="text-xs text-muted-foreground dark:text-zinc-400">Members</span>
        </div>
      </div>
    </CardContent>
  </div>

  {/* Completed Tasks Section */}
  <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-lg dark:shadow-2xl overflow-hidden">
    <div className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
            Completed Tasks
          </h4>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Recently completed tasks
          </p>
        </div>
      </div>
    </div>
    
    <div className="p-0">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin h-6 w-6 border-2 border-gray-300 dark:border-zinc-600 border-t-gray-700 dark:border-t-zinc-300 rounded-full mx-auto"></div>
            <p className="text-sm text-gray-500 dark:text-zinc-400">
              Loading tasks...
            </p>
          </div>
        </div>
      }>
        <CompletedTasksList userId={session.user.id} limit={3} />
      </Suspense>
    </div>
    
    <div className="border-t border-gray-200 dark:border-zinc-700 p-4">
      <Button 
        variant="ghost" 
        size="lg" 
        className="w-full group hover:bg-slate-100 dark:hover:bg-zinc-800" 
        asChild
      >
        <Link 
          href={`/dashboard/${session.user.id}/tasks?completed=true`} 
          className="flex items-center justify-center text-gray-700 dark:text-zinc-300 hover:text-black dark:hover:text-white"
        >
          View all completed tasks
          <ArrowRight className="ml-2 h-5 w-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Link>
      </Button>
    </div>
  </div>
</div>
            </div>
          </TabsContent>
          
          {/* Tasks tab content */}
          <TabsContent value="tasks" className="mt-0">
  <Card 
    className="w-full border-none rounded-xl shadow-sm 
               bg-white dark:bg-gray-950 
               ring-1 ring-gray-950/5 dark:ring-white/10 
               transition-all duration-200 
               hover:shadow-md hover:ring-gray-950/10 
               dark:hover:ring-white/20"
  >
    <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-950/5 dark:border-white/10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <CardTitle 
            className="text-xl font-semibold tracking-tight
                       text-gray-900 dark:text-white 
                       flex items-center gap-3"
          >
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            Your Tasks
          </CardTitle>
          <CardDescription 
            className="text-gray-600 dark:text-gray-400 
                       text-sm leading-relaxed"
          >
            Manage and track your upcoming tasks
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="px-3 py-1.5 rounded-lg 
                     border-gray-950/10 dark:border-white/10
                     text-gray-700 dark:text-gray-300
                     hover:bg-gray-50 dark:hover:bg-gray-800
                     hover:border-gray-950/20 dark:hover:border-white/20
                     transition-all duration-200 
                     flex items-center gap-2
                     font-medium text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Add Task
        </Button>
      </div>
    </CardHeader>
    
    <CardContent className="p-0">
      <Suspense 
        fallback={
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div 
                className="w-8 h-8 mx-auto 
                           border-2 border-transparent 
                           border-t-gray-300 dark:border-t-gray-600 
                           rounded-full animate-spin"
              ></div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                Loading your tasks...
              </p>
            </div>
          </div>
        }
      >
        <TasksTableMini userId={session.user.id} limit={5} />
      </Suspense>
    </CardContent>
    
    <CardFooter className="p-6 pt-4 border-t border-gray-950/5 dark:border-white/10">
      <Button 
        asChild 
        className="w-full rounded-lg h-9
                   bg-gray-900 dark:bg-white 
                   text-white dark:text-gray-900
                   hover:bg-gray-800 dark:hover:bg-gray-100
                   focus:ring-2 focus:ring-gray-950/20 dark:focus:ring-white/20
                   transition-all duration-200 
                   flex items-center justify-center gap-2 
                   group font-medium text-sm
                   shadow-sm"
      >
        <Link href={`/dashboard/${session.user.id}/tasks`}>
          View all tasks
          <ArrowRight 
            className="w-4 h-4 transition-transform duration-200
                       group-hover:translate-x-0.5" 
          />
        </Link>
      </Button>
    </CardFooter>
  </Card>
</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}