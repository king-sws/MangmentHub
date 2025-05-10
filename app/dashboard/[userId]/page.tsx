/* eslint-disable react/no-unescaped-entities */
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
  Clock,
  Activity,
  Users,
  Calendar,
  ArrowRight
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
import { UpcomingTasksList } from "@/components/tasks/UpcomingTasksList";
import { CompletedTasksList } from "@/components/tasks/CompletedTasksList";
import { Progress } from "@/components/ui/progress";

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
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-green-600",
    "from-pink-500 to-rose-600",
    "from-amber-500 to-orange-600",
    "from-purple-500 to-violet-600",
    "from-cyan-500 to-blue-600"
  ];
  
  // Use the sum of character codes in the ID to deterministically select a color
  const charSum = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[charSum % colors.length];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function DashboardPage({ params }: { params: { userId: string } }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/sign-in");
  }
  
  const boards = await getBoards();
  const workspaces = await getWorkspaces();
  const daysAgo = workspaces.length > 0 
    ? Math.floor(
        (Date.now() - new Date(workspaces[0].updatedAt || Date.now()).getTime()) /
        (1000 * 60 * 60 * 24)
      )
    : 0;


  // Get 3 most recent boards
  const recentBoards = boards.slice(0, 3);

  // Inside the DashboardPage component, after fetching session
  const subscription = await getCurrentSubscription();
  const effectivePlan = getEffectivePlan(subscription.plan, subscription.planExpires);
  const workspaceLimit = getWorkspaceLimit(effectivePlan);
  
  // Calculate some basic stats
  const stats = {
    totalBoards: boards.length,
    totalWorkspaces: workspaces.length,
    totalMembers: workspaces.map(w => w._count.members).reduce((a, b) => a + b, 0),
  };

  // Get current date formatted nicely
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {/* Welcome header with improved layout and visual elements */}
        <div className="rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 p-6 md:p-8 border border-primary/10 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{today}</p>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {session?.user?.name?.split(' ')[0] || "User"}
              </h1>
              <p className="text-muted-foreground">Here's an overview of your workspaces and tasks</p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" size="sm" asChild className="group">
                <Link href="/board/new">
                  <PlusCircle className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
                  New Board
                </Link>
              </Button>
              <Button 
                size="sm" 
                asChild 
                className="relative overflow-hidden"
                disabled={stats.totalWorkspaces >= workspaceLimit}
              >
                <Link 
                  href="/workspace/new" 
                  className="flex items-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-foreground opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  <PlusCircle className="h-4 w-4 mr-2" />
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

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="border-primary/20">
            {effectivePlan} Plan
          </Badge>
          <span>Workspaces: {stats.totalWorkspaces}/{workspaceLimit}</span>
          {stats.totalWorkspaces >= workspaceLimit && (
            <Link 
              href="/settings/subscription" 
              className="text-primary hover:underline flex items-center"
            >
              Upgrade Plan <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          )}
        </div>


        

        {/* Stats Overview with enhanced styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background dark:border-blue-900/50 group hover:shadow-lg transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2 group-hover:scale-110 transition-transform">
                <Briefcase className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkspaces}</div>
              <div className="flex items-center mt-1">
                <Progress 
                  value={(stats.totalWorkspaces / workspaceLimit) * 100} 
                  className="h-1"
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
          
          <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background dark:border-purple-900/50 group hover:shadow-lg transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Project Boards</CardTitle>
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-2 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBoards}</div>
              <div className="flex items-center mt-1">
                <Progress value={Math.min(stats.totalBoards * 5, 100)} className="h-1" />
                <span className="text-xs text-muted-foreground ml-2">{Math.min(stats.totalBoards * 5, 100)}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Active project boards
              </p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background dark:border-green-900/50 group hover:shadow-lg transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-600"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="text-2xl font-bold">--</div>}>
                <CompletedTasksCount userId={session.user.id} />
              </Suspense>
              <div className="flex items-center mt-1">
                <Progress value={65} className="h-1" />
                <span className="text-xs text-muted-foreground ml-2">65%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tasks successfully completed
              </p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background dark:border-amber-900/50 group hover:shadow-lg transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Tasks</CardTitle>
              <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2 group-hover:scale-110 transition-transform">
                <CalendarDays className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="text-2xl font-bold">--</div>}>
                <UpcomingTasksCount userId={session.user.id} />
              </Suspense>
              <div className="flex items-center mt-1">
                <Progress value={38} className="h-1" />
                <span className="text-xs text-muted-foreground ml-2">38%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Tasks due this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main content tabs with improved styling */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full md:w-auto grid-cols-2 bg-muted/80 p-1 rounded-lg">
            <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-background">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-md data-[state=active]:bg-background">
              <Calendar className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent boards column with animation effects */}
              <div className="lg:col-span-2 space-y-8">
                {/* Recent boards section with micro-interactions */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center">
                      <div className="bg-primary/10 p-2 rounded-lg mr-3">
                        <LayoutDashboard className="h-5 w-5 text-primary" />
                      </div>
                      Recent Boards
                    </h2>
                    <Button variant="ghost" size="sm" asChild className="group">
                      <Link href={""} className="text-sm text-muted-foreground group-hover:text-primary flex items-center">
                        View all
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-5">
                    {recentBoards.length > 0 ? (
                      recentBoards.map((board) => (
                        <Link key={board.id} href={`/board/${board.id}`}>
                          <Card className="overflow-hidden hover:shadow-lg transition-all border group hover:border-primary/30">
                            <div className="absolute inset-x-0 top-0 h-1 bg-primary/30 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"></div>
                            <div className="flex items-center p-4 hover:bg-muted/30 transition-colors">
                              <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <LayoutDashboard className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <h3 className="font-medium leading-none text-lg">{board.title}</h3>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-muted-foreground">
                                    {board.workspace?.name || "Unknown workspace"}
                                  </p>
                                  <span className="h-1 w-1 bg-muted-foreground/40 rounded-full"></span>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge variant="outline" className="border-primary/20 text-xs bg-primary/5 text-primary">
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
                          <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No boards yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Create your first board to start organizing your projects and tasks</p>
                        <Button asChild className="bg-gradient-to-r from-primary to-primary-foreground">
                          <Link href="/board/new">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Create your first board
                          </Link>
                        </Button>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Workspaces section with modern design */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center">
                      <div className="bg-primary/10 p-2 rounded-lg mr-3">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      Your Workspaces
                    </h2>
                    <Button variant="ghost" size="sm" asChild className="group">
                      <Link href="/workspaces" className="text-sm text-muted-foreground group-hover:text-primary flex items-center">
                        View all
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {workspaces.length > 0 ? (
                      workspaces.map((workspace) => (
                        <Link key={workspace.id} href={`/workspace/${workspace.id}`}>
                          <Card className="overflow-hidden hover:shadow-lg transition-all border-0 group">
                            <div className={`bg-gradient-to-r ${getWorkspaceColor(workspace.id)} h-2`}></div>
                            <div className="flex items-center p-4 hover:bg-muted/30 transition-colors">
                              <Avatar className="h-12 w-12 rounded-xl mr-4 bg-primary/10 border border-primary/20">
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
                                  <Users className="h-3 w-3 mr-1" />
                                  <span>{workspace._count.members} members</span>
                                  <span className="mx-2">•</span>
                                  <Activity className="h-3 w-3 mr-1" />
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
                          <Briefcase className="h-8 w-8 text-muted-foreground" />
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
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Create Workspace
                            </Link>
                          </Button>
                        )}
                      </Card>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column - Profile and tasks with enhanced styling */}
              <div className="space-y-6">
                {/* User profile card with visual enhancements */}
                <Card className="overflow-hidden border shadow-md">
                  <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5 relative">
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                      <Avatar className="h-16 w-16 ring-4 ring-background">
                        {session?.user?.image ? (
                          <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
                        ) : (
                          <AvatarFallback className="text-lg bg-gradient-to-br from-primary/30 to-primary/10 text-primary">
                            {getInitials(session?.user?.name)}
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
                        <span className="text-xs text-muted-foreground">members</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t p-4 flex justify-center">
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href="/profile" className="flex items-center justify-center">
                        Edit Profile
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Upcoming tasks with modern styling */}
                <Card className="overflow-hidden border shadow-md">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/20 dark:to-background pb-3">
                    <CardTitle className="flex items-center text-base font-medium">
                      <Clock className="h-4 w-4 mr-2 text-amber-500" />
                      Upcoming Tasks
                    </CardTitle>
                    <CardDescription>Tasks due this week</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Suspense fallback={
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-2">
                          <div className="animate-spin h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full mx-auto"></div>
                          <p className="text-sm text-muted-foreground">Loading tasks...</p>
                        </div>
                      </div>
                    }>
                      <UpcomingTasksList userId={session.user.id} limit={3} />
                    </Suspense>
                  </CardContent>
                  <CardFooter className="border-t p-4">
                    <Button variant="ghost" size="sm" className="w-full group" asChild>
                      <Link href={`/dashboard/${session.user.id}/tasks`} className="flex items-center justify-center">
                        View all tasks
                        <ArrowRight className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>

                {/* Completed tasks with modern styling */}
                <Card className="overflow-hidden border shadow-md">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-white dark:from-green-950/20 dark:to-background pb-3">
                    <CardTitle className="flex items-center text-base font-medium">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Completed Tasks
                    </CardTitle>
                    <CardDescription>Recently completed tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Suspense fallback={
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-2">
                          <div className="animate-spin h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full mx-auto"></div>
                          <p className="text-sm text-muted-foreground">Loading tasks...</p>
                        </div>
                      </div>
                    }>
                      <CompletedTasksList userId={session.user.id} limit={3} />
                    </Suspense>
                  </CardContent>
                  <CardFooter className="border-t p-4">
                    <Button variant="ghost" size="sm" className="w-full group" asChild>
                      <Link href={`/dashboard/${session.user.id}/tasks?completed=true`} className="flex items-center justify-center">
                        View all completed tasks
                        <ArrowRight className="ml-1 h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Tasks tab content */}
          <TabsContent value="tasks" className="mt-0">
            <Card className="border shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-background to-muted/30 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-primary/70" />
                      Your Tasks
                    </CardTitle>
                    <CardDescription>Manage your upcoming and ongoing tasks</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Suspense fallback={
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center space-y-3">
                      <div className="animate-spin h-8 w-8 border-3 border-primary/30 border-t-primary rounded-full mx-auto"></div>
                      <p className="text-muted-foreground">Loading your tasks...</p>
                    </div>
                  </div>
                }>
                  <TasksTableMini userId={session.user.id} limit={5} />
                </Suspense>
              </CardContent>
              <CardFooter className="border-t p-4">
                <Button asChild className="w-full bg-gradient-to-r from-primary to-primary-foreground hover:opacity-90 transition-opacity">
                  <Link href={`/dashboard/${session.user.id}/tasks`} className="flex items-center justify-center">
                    View all tasks
                    <ArrowRight className="ml-2 h-4 w-4" />
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