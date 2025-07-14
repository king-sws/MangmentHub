// app/board/[boardId]/page.tsx
import { BoardContent } from "@/components/BoardContent";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2, ArrowLeft, Users, Calendar, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// app/dashboard/[userId]/workspace/[workspaceId]/board/[boardId]/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Board | Blutto',
  description: 'Track tasks, manage timelines, and collaborate visually with your team using Blutto’s board view.',
  keywords: ['Blutto', 'Board', 'Kanban', 'Project management', 'Task tracking', 'Team productivity'],
};


interface BoardPageProps {
  params: { boardId: string };
}

export default async function BoardPage({ params }: BoardPageProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return redirect("/sign-in");
  }

  const boardId = params.boardId;
    
  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: true,
        lists: {
          include: {
            cards: {
              orderBy: {
                order: "asc"
              }
            },
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!board) {
      return notFound();
    }

    // Check if user is authorized to view this board
    const workspace = await prisma.workspace.findUnique({
      where: { id: board.workspaceId },
    });

    const isOwner = workspace?.userId === userId;
        
    // If not owner, check if user is a workspace member
    if (!isOwner) {
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          userId: userId,
          workspaceId: board.workspaceId,
        },
      });
            
      if (!membership) {
        return notFound();
      }
    }

    // Calculate board statistics
    const totalCards = board.lists.reduce((acc, list) => acc + list.cards.length, 0);
    const totalLists = board.lists.length;

    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br custom-scrollbar from-white to-slate-100 dark:from-[#000000] dark:to-[#111827]">
        {/* Enhanced Responsive Header */}
        <header className="bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-slate-950/90 sticky top-0 z-50 shadow-sm">
          <div className="px-3 sm:px-6 py-3 sm:py-4">
            {/* Mobile Layout */}
            <div className="flex flex-col space-y-3 sm:hidden">
              {/* Top row - Navigation and actions */}
              <div className="flex items-center justify-between">
                <Link 
                  href={`/workspace/${board.workspaceId}`}
                  className="flex items-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-0.5" />
                  <span className="font-medium text-sm">Back</span>
                </Link>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs font-medium">
                    Active
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                        <span className="sr-only">Board options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem>
                        <Link href={`/board/${board.id}/settings`}>Board settings</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href={`/board/${board.id}/export`}>Export board</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Link href={`/board/${board.id}/archive`}>Archive board</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Bottom row - Board title and info */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="truncate max-w-[200px]">{workspace?.name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate flex-1 mr-3">
                    {board.title}
                  </h1>
                  
                  <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      <span>{totalLists}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{totalCards}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between">
              {/* Left section - Navigation */}
              <div className="flex items-center space-x-4">
                <Link 
                  href={`/workspace/${board.workspaceId}`}
                  className="flex items-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-0.5" />
                  <span className="font-medium text-sm">Back to Workspace</span>
                </Link>
                
                {/* Breadcrumb separator */}
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
                
                <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                  <span>{workspace?.name}</span>
                </div>
              </div>

              {/* Center section - Board title and info */}
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {board.title}
                  </h1>
                  <div className="flex items-center justify-center space-x-4 mt-1">
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                      <Users className="w-3 h-3 mr-1" />
                      <span>{totalLists} lists</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{totalCards} cards</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right section - Actions */}
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="text-xs font-medium">
                  Active
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                      <span className="sr-only">Board options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem>
                      <Link href={`/board/${board.id}/settings`}>Board settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Link href={`/board/${board.id}/export`}>Export board</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Link href={`/board/${board.id}/archive`}>Archive board</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 min-h-0 overflow-hidden">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center h-full px-4">
                <div className="flex items-center space-x-3 mb-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-lg font-medium text-slate-700 dark:text-slate-300">
                    Loading board
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  Please wait while we fetch your data...
                </p>
              </div>
            }
          >
            <BoardContent board={board} />
          </Suspense>
        </main>
      </div>
    );
  } catch (error) {
    console.error("Error loading board:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center p-6 sm:p-8 max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">!</span>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Unable to Load Board
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            We encountered an issue while loading your board. This might be due to a temporary connection problem.
          </p>
          
          <div className="space-y-3">
            <Button 
              asChild
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href={`/workspace/${params.boardId}`}>
                Try Again
              </Link>
            </Button>
            
            <Button 
              asChild
              variant="outline"
              className="w-full"
            >
              <Link href="/workspaces">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Workspaces
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}