
// api/lists/[listId]/cards/route.ts - FIXED with proper permissions
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { requirePermission, getUserWorkspaceRole, hasPermission } from "@/lib/permission";

// Add a card to a specific list
export async function POST(
  req: Request,
  { params }: { params: { listId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { listId } = params;
    const { title, description, dueDate, status } = await req.json();
    const userId = session.user.id;

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    // Verify the list exists and get workspace info
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        board: {
          include: {
            workspace: {
              include: {
                members: true
              }
            }
          }
        },
        cards: {
          orderBy: {
            order: 'desc'
          },
          take: 1
        }
      }
    });

    if (!list) {
      return new NextResponse("List not found", { status: 404 });
    }

    const workspaceId = list.board.workspaceId;

    // FIXED: Use proper permission system
    const permissionCheck = await requirePermission(userId, workspaceId, 'CREATE_CARD');
    
    if (!permissionCheck.success) {
      return new NextResponse(
        permissionCheck.error || "Cannot create cards in this workspace", 
        { status: permissionCheck.status || 403 }
      );
    }

    // Get the highest order in the list
    const newOrder = list.cards.length > 0 ? list.cards[0].order + 1 : 0;

    // Create the card
    const card = await prisma.card.create({
      data: {
        title,
        listId,
        order: newOrder,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "TODO",
      }
    });

    console.log(`[LIST_CARDS_POST] Card "${title}" created by user ${userId} (role: ${await getUserWorkspaceRole(userId, workspaceId)})`);

    return NextResponse.json(card);
  } catch (error) {
    console.error("[LIST_CARDS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Get cards for a specific list
export async function GET(
  req: Request,
  { params }: { params: { listId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { listId } = params;
    const userId = session.user.id;

    // Verify the list exists and get workspace info
    const list = await prisma.list.findUnique({
      where: { id: listId },
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

    if (!list) {
      return new NextResponse("List not found", { status: 404 });
    }

    const workspaceId = list.board.workspaceId;

    // FIXED: Use proper permission system
    const permissionCheck = await requirePermission(userId, workspaceId, 'VIEW_BOARD');
    
    if (!permissionCheck.success) {
      return new NextResponse(
        permissionCheck.error || "Cannot view this board", 
        { status: permissionCheck.status || 403 }
      );
    }

    // Get all cards in the list
    const cards = await prisma.card.findMany({
      where: { listId },
      orderBy: { order: 'asc' },
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
    });

    // Get user permissions for additional context
    const userPermissions = {
      canCreateCard: await hasPermission(userId, workspaceId, 'CREATE_CARD'),
      canEditAnyCard: await hasPermission(userId, workspaceId, 'EDIT_ANY_CARD'),
      canEditOwnCard: await hasPermission(userId, workspaceId, 'EDIT_OWN_CARD'),
      canEditAssignedCard: await hasPermission(userId, workspaceId, 'EDIT_ASSIGNED_CARD'),
      canDeleteAnyCard: await hasPermission(userId, workspaceId, 'DELETE_ANY_CARD'),
      canDeleteOwnCard: await hasPermission(userId, workspaceId, 'DELETE_OWN_CARD'),
      canReorderCards: await hasPermission(userId, workspaceId, 'REORDER_CARDS'),
      canMoveCards: await hasPermission(userId, workspaceId, 'MOVE_CARDS'),
      canAssignCards: await hasPermission(userId, workspaceId, 'ASSIGN_CARD'),
    };

    console.log(`[LIST_CARDS_GET] Found ${cards.length} cards for list ${listId} by user ${userId} (role: ${await getUserWorkspaceRole(userId, workspaceId)})`);

    return NextResponse.json({
      cards,
      permissions: userPermissions,
      userRole: await getUserWorkspaceRole(userId, workspaceId)
    });
  } catch (error) {
    console.error("[LIST_CARDS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}