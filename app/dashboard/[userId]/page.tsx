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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10 font-sans  ">
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-12">
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
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl md:text-2xl font-semibold flex items-center">
                      <div className="bg-primary/10 p-2 rounded-lg mr-3">
                        <LayoutDashboard className="h-5 w-5 text-purple-600" aria-label="Recent Boards" />
                      </div>
                      Recent Boards
                    </h2>
                    <Button variant="ghost" size="sm" asChild className="group">
                      <Link href="/boards" className="text-sm text-muted-foreground group-hover:text-primary flex items-center">
                        View all
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" aria-label="View All Boards" />
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-5">
                    {recentBoards.length > 0 ? (
                      recentBoards.map((board) => (
                        <Link key={board.id} href={`/board/${board.id}`}>
                          <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all border group hover:border-primary/40">
                            <div className={`absolute inset-x-0 top-0 h-1 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out bg-gradient-to-r ${getWorkspaceColor(board.workspace?.id)}`}/>
                            <div className="flex items-center p-4 hover:bg-muted/40 transition-colors">
                              <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <LayoutDashboard className="h-6 w-6 text-cyan-600" aria-label="Board Icon" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <h3 className="font-medium text-lg">{board.title}</h3>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-cyan-600">
                                    {board.workspace?.name || "Unknown workspace"}
                                  </p>
                                  <span className="h-1 w-1 bg-muted-foreground/40 rounded-full"></span>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge variant="outline" className="border-primary/30 text-xs bg-primary/10 text-primary">
                                  Active
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      ))
                    ) : (
                      <Card className="p-8 text-center border-dashed bg-muted/50">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <LayoutDashboard className="h-8 w-8 text-indigo-700" aria-label="No Boards" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No boards yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Create your first board to start organizing your projects and tasks</p>
                        <Button asChild className="bg-indigo-600 text-white hover:bg-indigo-700">
                          <Link href="/board/new">
                            <PlusCircle className="h-4 w-4 mr-2" aria-label="Create Board" />
                            Create your first board
                          </Link>
                        </Button>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Workspaces section */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl md:text-2xl font-semibold flex items-center">
                      <div className="bg-primary/10 p-2 rounded-lg mr-3">
                        <Briefcase className="h-5 w-5 text-blue-600" aria-label="Workspaces" />
                      </div>
                      Your Workspaces
                    </h2>
                    <Button variant="ghost" size="sm" asChild className="group">
                      <Link href="/workspaces" className="text-sm text-muted-foreground group-hover:text-primary flex items-center">
                        View all
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" aria-label="View All Workspaces" />
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {workspaces.length > 0 ? (
                      workspaces.map((workspace) => (
                        <Link key={workspace.id} href={`/workspace/${workspace.id}`}>
                          <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all border-0 group">
                            <div className={`bg-gradient-to-r ${getWorkspaceColor(workspace.id)} h-2`}></div>
                            <div className="flex items-center p-4 hover:bg-muted/40 transition-colors">
                              <Avatar className="h-12 w-12 rounded-xl mr-4 bg-primary/10 border border-primary/30">
                                <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                                  {getInitials(workspace.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                  <h3 className="font-medium text-base">{workspace.name}</h3>
                                  <Badge variant="secondary">{workspace._count.boards} boards</Badge>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Users className="h-3 w-3 mr-1" aria-label="Members" />
                                  <span>{workspace._count.members} members</span>
                                  <span className="mx-2">•</span>
                                  <Activity className="h-3 w-3 mr-1" aria-label="Activity" />
                                  <span>Active {daysAgo}d ago</span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      ))
                    ) : (
                      <Card className="p-8 text-center border-dashed bg-muted/50 col-span-2">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Briefcase className="h-8 w-8 text-muted-foreground" aria-label="No Workspaces" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">
                          {stats.totalWorkspaces >= workspaceLimit ? (
                            "Workspace Limit Reached"
                          ) : (
                            "No workspaces yet"
                          )}
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                          {stats.totalWorkspaces >= workspaceLimit ? (
                            `Your ${effectivePlan} plan allows up to ${workspaceLimit} workspaces.`
                          ) : (
                            "Create your first workspace to start collaborating with your team"
                          )}
                        </p>
                        {stats.totalWorkspaces >= workspaceLimit ? (
                          <Button asChild className="bg-gradient-to-r from-primary to-primary-foreground">
                            <Link href="/settings/subscription">
                              Upgrade Plan
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild className="bg-gradient-to-r from-primary to-primary-foreground">
                            <Link href="/workspace/new">
                              <PlusCircle className="h-4 w-4 mr-2" aria-label="Create Workspace" />
                              Create Workspace
                            </Link>
                          </Button>
                        )}
                      </Card>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column - Profile and tasks */}
              <div className="space-y-6">
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
    <div className="relative bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 h-24">
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
        <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-900 shadow-md">
          {user?.image ? (
            <AvatarImage 
              src={user.image} 
              alt={user.name || "User"} 
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="text-3xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">
              {getInitials(user?.name)}
            </AvatarFallback>
          )}
        </Avatar>
      </div>
    </div>
    <CardContent className="flex flex-col items-center text-center pt-12 pb-5">
                    <h3 className="font-medium text-lg">{session?.user?.name || "User"}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{session?.user?.email || ""}</p>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-semibold">{stats.totalBoards}</span>
                        <span className="text-xs text-muted-foreground">Boards</span>
                      </div>
                      <div className="h-10 w-px bg-border"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-semibold">{stats.totalWorkspaces}</span>
                        <span className="text-xs text-muted-foreground">Workspaces</span>
                      </div>
                      <div className="h-10 w-px bg-border"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-semibold">{stats.totalMembers}</span>
                        <span className="text-xs text-muted-foreground">Members</span>
                      </div>
                    </div>
                  </CardContent>
  </div>

  {/* Completed Tasks Section */}
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
            Completed Tasks
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Recently completed tasks
          </p>
        </div>
      </div>
    </div>
    
    <div className="p-0">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin h-6 w-6 border-2 border-gray-300 dark:border-gray-600 border-t-gray-700 dark:border-t-gray-300 rounded-full mx-auto"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading tasks...
            </p>
          </div>
        </div>
      }>
        <CompletedTasksList userId={session.user.id} limit={3} />
      </Suspense>
    </div>
    
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      <Button 
        variant="ghost" 
        size="lg" 
        className="w-full group" 
        asChild
      >
        <Link 
          href={`/dashboard/${session.user.id}/tasks?completed=true`} 
          className="flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
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
              className="w-full border-none rounded-2xl shadow-2xl 
                         bg-white dark:bg-neutral-900 
                         ring-1 ring-gray-100 dark:ring-neutral-800 
                         transition-all duration-300 
                         hover:shadow-3xl hover:ring-gray-200 
                         dark:hover:ring-neutral-700"
            >
              <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle 
                      className="text-2xl font-semibold 
                                 text-gray-800 dark:text-neutral-100 
                                 flex items-center gap-3"
                    >
                      <Calendar className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                      Your Tasks
                    </CardTitle>
                    <CardDescription 
                      className="text-gray-500 dark:text-indigo-400 
                                 text-sm font-normal"
                    >
                      Manage and track your upcoming tasks
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    className="px-4 py-2 rounded-lg 
                               border-indigo-200 dark:border-indigo-700
                               text-indigo-700 dark:text-indigo-300
                               hover:bg-indigo-50 dark:hover:bg-indigo-800 
                               transition-colors duration-200 
                               flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
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
                          className="w-12 h-12 mx-auto 
                                     border-4 border-transparent 
                                     border-t-indigo-600 dark:border-t-indigo-400 
                                     rounded-full animate-spin"
                        ></div>
                        <p className="text-gray-500 dark:text-neutral-400 text-sm">
                          Loading your tasks...
                        </p>
                      </div>
                    </div>
                  }
                >
                  <TasksTableMini userId={session.user.id} limit={5} />
                </Suspense>
              </CardContent>
              
              <CardFooter className="p-6 pt-4 border-t border-gray-100 dark:border-neutral-800">
                <Button 
                  asChild 
                  className="w-full rounded-lg 
                             bg-indigo-600 dark:bg-indigo-500 
                             text-white 
                             hover:bg-indigo-700 dark:hover:bg-indigo-600
                             focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-700/30
                             transition-all duration-300 
                             flex items-center justify-center gap-2 
                             group"
                >
                  <Link href={`/dashboard/${session.user.id}/tasks`}>
                    View all tasks
                    <ArrowRight 
                      className="w-4 h-4 transition-transform 
                                 group-hover:translate-x-1" 
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