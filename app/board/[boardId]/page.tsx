// app/board/[boardId]/page.tsx
import { BoardContent } from "@/components/BoardContent";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";

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
    // First check if user is the workspace owner
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

    return (
      <div className="flex flex-col h-screen">
        {/* Back button header */}
        <div className="bg-card border-b px-6 py-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm bg-opacity-80">
          <Link 
            href={`/workspace/${board.workspaceId}`} 
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Back to Workspace</span>
          </Link>
          <h1 className="text-xl font-bold">{board.title}</h1>
          <div className="w-[120px]"></div> {/* Spacer to center the title */}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-lg text-muted-foreground">Loading board...</span>
              </div>
            }
          >
            <BoardContent board={board} />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading board:", error);
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-destructive text-xl font-semibold">Failed to load board</div>
        <p className="text-muted-foreground mt-2">Please try again later</p>
        <Button 
          asChild
          variant="default" 
          className="mt-6"
        >
          <Link href="/workspaces">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Workspaces
          </Link>
        </Button>
      </div>
    );
  }
}