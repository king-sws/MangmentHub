// api/board/[boardId]/route.ts - Fixed with proper permission system
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, getUserWorkspaceRole } from "@/lib/permission";

const updateBoardSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters").optional(),
  order: z.number().int().min(0).optional(),
});

// Helper function to get board with workspace info
async function getBoardWithWorkspace(boardId: string) {
  return await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          userId: true,
        },
      },
    },
  });
}

// GET board by ID
export async function GET(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get board to check workspace access
    const board = await getBoardWithWorkspace(params.boardId);
    
    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    // Check VIEW_BOARD permission
    const permissionCheck = await requirePermission(userId, board.workspaceId, 'VIEW_BOARD');
    
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status || 403 }
      );
    }

    // Get detailed board data
    const detailedBoard = await prisma.board.findUnique({
      where: { id: params.boardId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
        lists: {
          include: {
            cards: {
              include: {
                assignees: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
              orderBy: { order: "asc" },
            },
            _count: {
              select: {
                cards: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            lists: true,
          },
        },
      },
    });

    if (!detailedBoard) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    // Add computed statistics
    const totalCards = detailedBoard.lists.reduce((acc, list) => acc + list._count.cards, 0);
    const completedCards = detailedBoard.lists.reduce(
      (acc, list) => acc + list.cards.filter(card => card.completed).length,
      0
    );

    // Get user role for frontend permissions
    const userRole = await getUserWorkspaceRole(userId, board.workspaceId);

    const boardWithStats = {
      ...detailedBoard,
      totalCards,
      completedCards,
      completionRate: totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0,
      userRole, // Include user role for frontend permission checks
    };

    return NextResponse.json({
      success: true,
      data: boardWithStats,
    });
  } catch (error) {
    console.error("[BOARD_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH board by ID
export async function PATCH(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = updateBoardSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    // Get board to check workspace access
    const board = await getBoardWithWorkspace(params.boardId);
    
    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    // Check EDIT_BOARD permission (OWNER, ADMIN, MEMBER all have this)
    const permissionCheck = await requirePermission(userId, board.workspaceId, 'EDIT_BOARD');
    
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status || 403 }
      );
    }

    const updatedBoard = await prisma.board.update({
      where: { id: params.boardId },
      data: validation.data,
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
        _count: {
          select: {
            lists: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedBoard,
      message: "Board updated successfully",
    });
  } catch (error) {
    console.error("[BOARD_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE board by ID
export async function DELETE(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get board to check workspace access
    const board = await getBoardWithWorkspace(params.boardId);
    
    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    // Check DELETE_BOARD permission (only OWNER and ADMIN have this)
    const permissionCheck = await requirePermission(userId, board.workspaceId, 'DELETE_BOARD');
    
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status || 403 }
      );
    }

    // Check if board has data (optional: prevent accidental deletion)
    const boardStats = await prisma.board.findUnique({
      where: { id: params.boardId },
      include: {
        _count: {
          select: {
            lists: true,
          },
        },
      },
    });

    const deleted = await prisma.board.delete({
      where: { id: params.boardId },
    });

    return NextResponse.json({
      success: true,
      data: deleted,
      message: "Board deleted successfully",
      stats: {
        deletedLists: boardStats?._count.lists || 0,
      },
    });
  } catch (error) {
    console.error("[BOARD_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}