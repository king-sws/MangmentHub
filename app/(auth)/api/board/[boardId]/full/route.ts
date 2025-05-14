// api/board/%5BboardId%5D/full/route.ts
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET full board data by ID
export async function GET(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    console.log("API Request for board:", params.boardId);
    
    const session = await auth();
    console.log("Authenticated user:", session?.user?.id);
    
    if (!session?.user?.id) {
      console.log("Authentication failed - no user session");
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // First, check if the board exists
    const board = await prisma.board.findUnique({
      where: {
        id: params.boardId,
      },
      include: {
        workspace: true,
      },
    });
    
    console.log("Board found:", board ? "Yes" : "No");
    
    if (!board) {
      console.log("Board not found");
      return new NextResponse("Board not found", { status: 404 });
    }
    
    console.log("Board workspace userId:", board.workspace.userId);
    console.log("Current user id:", session.user.id);
    
    // Check direct ownership
    const isOwner = board.workspace.userId === session.user.id;
    
    // If not owner, check workspace membership
    let isMember = false;
    if (!isOwner) {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: session.user.id,
            workspaceId: board.workspace.id,
          },
        },
      });
      isMember = !!membership;
      console.log("User is workspace member:", isMember);
    }
    
    if (!isOwner && !isMember) {
      console.log("User is not authorized to access this board");
      return new NextResponse("Not authorized to access this board", { status: 403 });
    }
    
    // Now get the full board data with lists and cards
    const fullBoard = await prisma.board.findUnique({
      where: {
        id: params.boardId,
      },
      include: {
        workspace: true,
        lists: {
          orderBy: {
            order: 'asc'
          },
          include: {
            cards: {
              orderBy: {
                order: 'asc'
              },
              include: {
                assignees: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                  }
                }
              }
            }
          }
        }
      },
    });
    
    console.log("Lists found:", fullBoard?.lists?.length || 0);
    
    return NextResponse.json(fullBoard);
  } catch (error) {
    console.error("[BOARD_FULL_GET]", error);
    return new NextResponse(`Internal Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}