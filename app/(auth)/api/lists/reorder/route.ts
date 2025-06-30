// api/lists/reorder/route.ts - FIXED with proper permissions
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { requirePermission, getUserWorkspaceRole } from "@/lib/permission";

export async function POST(req: Request) {
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

    // FIXED: Use proper permission system instead of ownership check
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