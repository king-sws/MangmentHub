// /api/lists/route.ts - Enhanced with Permission System
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { 
  requirePermission,
  getUserWorkspaceRole,
  hasPermission 
} from "@/lib/permission";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, boardId } = await req.json();
    const userId = session.user.id;

    if (!title || !boardId) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    // Verify board exists and get workspace info
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { 
        workspace: {
          include: {
            members: true
          }
        }
      },
    });

    if (!board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    const workspaceId = board.workspaceId;

    // Enhanced permission check - use the new permission system
    const permissionCheck = await requirePermission(userId, workspaceId, 'CREATE_LIST');
    
    if (!permissionCheck.success) {
      return new NextResponse(
        permissionCheck.error || "Cannot create lists in this workspace", 
        { status: permissionCheck.status || 403 }
      );
    }

    // Get max order to place new list at the end
    const maxOrderList = await prisma.list.findFirst({
      where: { boardId },
      orderBy: { order: 'desc' },
    });

    const newOrder = maxOrderList ? maxOrderList.order + 1 : 0;

    const list = await prisma.list.create({
      data: {
        title,
        boardId,
        order: newOrder,
      },
      include: {
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    console.log(`[LIST_POST] List "${title}" created by user ${userId} (role: ${await getUserWorkspaceRole(userId, workspaceId)})`);

    return NextResponse.json(list);
  } catch (error) {
    console.error("[LIST_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get("boardId");
    const userId = session.user.id;

    if (!boardId) {
      return new NextResponse("Missing boardId", { status: 400 });
    }

    // Verify board exists and get workspace info
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { 
        workspace: {
          include: {
            members: true
          }
        }
      },
    });

    if (!board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    const workspaceId = board.workspaceId;

    // Enhanced permission check - use the new permission system
    const permissionCheck = await requirePermission(userId, workspaceId, 'VIEW_BOARD');
    
    if (!permissionCheck.success) {
      return new NextResponse(
        permissionCheck.error || "Cannot view this board", 
        { status: permissionCheck.status || 403 }
      );
    }

    const lists = await prisma.list.findMany({
      where: {
        boardId,
      },
      orderBy: {
        order: "asc",
      },
      include: {
        // Include count of cards for each list
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    // Add proper logging to help debug
    console.log(`[LIST_GET] Found ${lists.length} lists for board ${boardId} by user ${userId} (role: ${await getUserWorkspaceRole(userId, workspaceId)})`);

    // Get user permissions for additional context
    const userPermissions = {
      canCreateList: await hasPermission(userId, workspaceId, 'CREATE_LIST'),
      canEditList: await hasPermission(userId, workspaceId, 'EDIT_LIST'),
      canDeleteList: await hasPermission(userId, workspaceId, 'DELETE_LIST'),
      canReorderLists: await hasPermission(userId, workspaceId, 'REORDER_LISTS'),
      canCreateCard: await hasPermission(userId, workspaceId, 'CREATE_CARD'),
      canReorderCards: await hasPermission(userId, workspaceId, 'REORDER_CARDS'),
      canMoveCards: await hasPermission(userId, workspaceId, 'MOVE_CARDS'),
    };

    return NextResponse.json({
      lists,
      permissions: userPermissions,
      userRole: await getUserWorkspaceRole(userId, workspaceId)
    });
  } catch (error) {
    console.error("[LIST_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// List reordering endpoint with enhanced permissions
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { lists } = await req.json();
    const userId = session.user.id;

    if (!lists || !Array.isArray(lists) || lists.length === 0) {
      return new NextResponse("Invalid lists data", { status: 400 });
    }

    // Verify all list IDs exist and belong to the same board and workspace
    const listIds = lists.map(list => list.id);
        
    const dbLists = await prisma.list.findMany({
      where: {
        id: { in: listIds }
      },
      include: {
        board: {
          include: {
            workspace: {
              include: {
                members: true
              }
            }
          }
        }
      }
    });

    if (dbLists.length !== listIds.length) {
      return new NextResponse("One or more lists not found", { status: 404 });
    }

    // Check if all lists belong to the same board and workspace
    const boardId = dbLists[0].boardId;
    const workspaceId = dbLists[0].board.workspaceId;

    if (!dbLists.every(list => list.boardId === boardId && list.board.workspaceId === workspaceId)) {
      return new NextResponse("Lists must belong to the same board", { status: 400 });
    }

    // Enhanced permission check - use the new permission system
    const permissionCheck = await requirePermission(userId, workspaceId, 'REORDER_LISTS');
    
    if (!permissionCheck.success) {
      return new NextResponse(
        permissionCheck.error || "Cannot reorder lists in this workspace", 
        { status: permissionCheck.status || 403 }
      );
    }

    // Update the order of each list in a transaction
    const updates = lists.map(list =>
      prisma.list.update({
        where: { id: list.id },
        data: { order: list.order }
      })
    );

    await prisma.$transaction(updates);

    console.log(`[LISTS_REORDER] ${lists.length} lists reordered by user ${userId} (role: ${await getUserWorkspaceRole(userId, workspaceId)})`);

    return NextResponse.json({ 
      success: true,
      message: `Successfully reordered ${lists.length} lists`
    });
  } catch (error) {
    console.error("[LISTS_REORDER]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}