/* eslint-disable react/no-unescaped-entities */
// app/workspace/[workspaceId]/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { CreateBoardButton } from "./_components/CreateBoardButton";
import { BoardCard } from "./_components/BoardCard";
import { EmptyState } from "./_components/EmptyState";
import { WorkspaceAvatar } from "@/components/WorkspaceAvatar";
import { notFound, redirect } from "next/navigation";
import { 
  Users, 
  Settings, 
  Search, 
  LayoutGrid, 
  Clock, 
  Star, 
  Filter, 
  SortDesc,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCurrentSubscription } from "@/actions/subscription";
import { getEffectivePlan, getBoardLimit, getMemberLimit } from "@/lib/plans";

interface WorkspacePageProps {
  params: {
    workspaceId: string;
  };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return redirect("/sign-in");
  }

  // First, check if the workspace exists
  const workspace = await prisma.workspace.findUnique({
    where: { id: params.workspaceId },
  });

  if (!workspace) {
    return notFound();
  }

  // Check if user is the owner
  const isOwner = workspace.userId === userId;
  
  // If not owner, check if user is a member
  let isMember = false;
  
  if (!isOwner) {
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: userId,
        workspaceId: params.workspaceId,
      },
    });
    
    isMember = !!membership;
    
    // If not a member either, return not found
    if (!isMember) {
      return notFound();
    }
  }
  
  // Fetch workspace members for display with role sorting (OWNER first)
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: params.workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: [
      { role: "asc" }, // OWNER first
      { createdAt: "asc" },
    ],
    take: 5, // Limit to 5 members for display
  });

  // Count total members
  const totalMembersCount = await prisma.workspaceMember.count({
    where: { workspaceId: params.workspaceId }
  });

  // Get all boards for this workspace
  const boards = await prisma.board.findMany({
    where: {
      workspaceId: params.workspaceId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Count starred boards (placeholder for future functionality)
  // In a real implementation, you would have a starredBoards table or field
  const starredBoards = boards.slice(0, 2); // Just using first two for demo
  
  // Get creation date formatted
  const createdAt = new Date(workspace.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get the current plan and limits
  const subscription = await getCurrentSubscription();
  const effectivePlan = getEffectivePlan(subscription.plan, subscription.planExpires);
  const boardLimit = getBoardLimit(effectivePlan);
  const memberLimit = getMemberLimit(effectivePlan);
  
  // Check if limits are reached
  const isBoardLimitReached = boards.length >= boardLimit;
  const isMemberLimitReached = totalMembersCount >= memberLimit;

  return (
    <div className="pb-6">
      {/* Top navbar with workspace info */}
      <div className="bg-card border-b px-6 py-4 sticky top-0 z-20 backdrop-blur-sm bg-opacity-80">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center">
            <WorkspaceAvatar name={workspace.name} className="h-10 w-10 mr-3" />
            <div>
              <h1 className="text-xl font-bold flex items-center">
                {workspace.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Created {createdAt} • {totalMembersCount} member{totalMembersCount !== 1 ? 's' : ''} • {boards.length} board{boards.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/workspace/${params.workspaceId}/members`}>
                    <Users className="h-4 w-4 mr-2" />
                    Members
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/workspace/${params.workspaceId}/settings`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </Button>
              </>
            )}
            <CreateBoardButton 
              workspaceId={params.workspaceId} 
              disabled={isBoardLimitReached} 
              currentCount={boards.length}
              limit={boardLimit}
              plan={effectivePlan}
            />
          </div>
        </div>
      </div>

      <div className="px-6 mt-6">
        {/* Plan limit alerts */}
        {(isBoardLimitReached || isMemberLimitReached) && (
          <div className="mb-6 space-y-3">
            {isBoardLimitReached && (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You've reached your board limit ({boards.length}/{boardLimit}) on the {effectivePlan} plan.{" "}
                  <Link href="/settings/subscription" className="font-medium underline underline-offset-4">
                    Upgrade now
                  </Link>{" "}
                  to create more boards.
                </AlertDescription>
              </Alert>
            )}
            
            {isMemberLimitReached && (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You've reached your member limit ({totalMembersCount}/{memberLimit}) on the {effectivePlan} plan.{" "}
                  <Link href="/settings/subscription" className="font-medium underline underline-offset-4">
                    Upgrade now
                  </Link>{" "}
                  to add more members.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        {/* Tabs for boards views */}
        <Tabs defaultValue="all" className="mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <TabsList>
              <TabsTrigger value="all" className="flex items-center">
                <LayoutGrid className="h-4 w-4 mr-2" />
                All Boards
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Recent
              </TabsTrigger>
              <TabsTrigger value="starred" className="flex items-center">
                <Star className="h-4 w-4 mr-2" />
                Starred
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-[200px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search boards..." className="pl-8" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <SortDesc className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="all" className="space-y-8">
            {/* Members section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary/70" />
                  Workspace Members
                  {isMemberLimitReached && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Limit Reached ({totalMembersCount}/{memberLimit})
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  People with access to this workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {members.map((member) => (
                    <div 
                      key={member.userId} 
                      className="flex items-center p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors"
                      title={member.user?.name || "Unknown User"}
                    >
                      <Avatar className="h-8 w-8 mr-2">
                        {member.user?.image ? (
                          <AvatarImage
                            src={member.user.image}
                            alt={member.user?.name || "User"}
                          />
                        ) : (
                          <AvatarFallback>
                            {member.user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {member.user?.name || "Unknown User"}
                          {member.userId === userId && (
                            <span className="text-xs ml-2 text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                {totalMembersCount > members.length && (
                  <Button variant="ghost" size="sm" asChild className="h-auto ml-auto">
                    <Link href={`/workspace/${params.workspaceId}/members`}>
                      View all {totalMembersCount} members
                    </Link>
                  </Button>
                )}
                
                {members.length === 0 && (
                  <p className="text-muted-foreground text-sm">No members found</p>
                )}
              </CardFooter>
            </Card>

            {/* Boards Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <LayoutGrid className="h-5 w-5 mr-2 text-primary/70" />
                  All Boards
                  {isBoardLimitReached && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Limit Reached ({boards.length}/{boardLimit})
                    </span>
                  )}
                </h2>
                <CreateBoardButton 
                  workspaceId={params.workspaceId} 
                  disabled={isBoardLimitReached}
                  currentCount={boards.length}
                  limit={boardLimit}
                  plan={effectivePlan}
                />
              </div>
              
              {boards.length === 0 ? (
                <EmptyState
                  title="No boards yet"
                  description="Create your first board to get started"
                  icon={<LayoutGrid className="h-10 w-10 text-muted-foreground" />}
                  action={
                    <CreateBoardButton 
                      workspaceId={params.workspaceId}
                      disabled={isBoardLimitReached}
                      currentCount={0}
                      limit={boardLimit}
                      plan={effectivePlan} 
                    />
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {boards.map((board) => (
                    <BoardCard 
                      key={board.id} 
                      id={board.id} 
                      title={board.title} 
                      createdAt={board.createdAt}
                      updatedAt={board.updatedAt ?? undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="recent">
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold flex items-center mb-4">
                  <Clock className="h-5 w-5 mr-2 text-primary/70" />
                  Recently Viewed
                </h2>
                
                {boards.length === 0 ? (
                  <EmptyState
                    title="No recent boards"
                    description="Boards you view will appear here"
                    icon={<Clock className="h-10 w-10 text-muted-foreground" />}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {boards.slice(0, 4).map((board) => (
                      <BoardCard 
                        key={board.id} 
                        id={board.id} 
                        title={board.title} 
                        createdAt={board.createdAt}
                        updatedAt={board.updatedAt ?? undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="starred">
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold flex items-center mb-4">
                  <Star className="h-5 w-5 mr-2 text-primary/70" />
                  Starred Boards
                </h2>
                
                {starredBoards.length === 0 ? (
                  <EmptyState
                    title="No starred boards"
                    description="Star boards for quick access"
                    icon={<Star className="h-10 w-10 text-muted-foreground" />}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {starredBoards.map((board) => (
                      <BoardCard 
                        key={board.id} 
                        id={board.id} 
                        title={board.title} 
                        createdAt={board.createdAt}
                        updatedAt={board.updatedAt ?? undefined}
                        isStarred
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}