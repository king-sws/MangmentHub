/* eslint-disable @typescript-eslint/no-explicit-any */
// api/cards/[cardId]/route.ts - Enhanced with Permission System
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { 
  canEditCard, 
  canDeleteCard, 
  requirePermission,
  getUserWorkspaceRole 
} from "@/lib/permission";

// Update a card by ID
export async function PATCH(
  req: Request,
  { params }: { params: { cardId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { cardId } = params;
    const updateData = await req.json();

    // Validate update data
    const validUpdates = ["title", "description", "dueDate", "status", "completed", "listId", "order"];
    const filteredUpdates = Object.entries(updateData)
      .filter(([key]) => validUpdates.includes(key))
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as Record<string, any>);

    // If updating dueDate, convert to Date object
    if (filteredUpdates.dueDate) {
      filteredUpdates.dueDate = new Date(filteredUpdates.dueDate);
    }

    // Get the card to verify ownership and permissions
    const existingCard = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
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
        },
        assignees: {
          select: { id: true }
        }
      }
    });

    if (!existingCard) {
      return new NextResponse("Card not found", { status: 404 });
    }

    const workspaceId = existingCard.list.board.workspaceId;
    const userId = session.user.id;

    // Enhanced permission check using the new system
    const canEdit = await canEditCard(userId, cardId, workspaceId);
    
    if (!canEdit) {
      const userRole = await getUserWorkspaceRole(userId, workspaceId);
      return new NextResponse(
        `Insufficient permissions to edit this card. Your role: ${userRole || 'Not a member'}`, 
        { status: 403 }
      );
    }

    // Special handling for moving cards between lists
    if (filteredUpdates.listId && filteredUpdates.listId !== existingCard.listId) {
      // Check if user can move cards
      const permissionCheck = await requirePermission(userId, workspaceId, 'MOVE_CARDS');
      
      if (!permissionCheck.success) {
        return new NextResponse(
          permissionCheck.error || "Cannot move cards between lists", 
          { status: permissionCheck.status || 403 }
        );
      }

      // Verify target list exists and is in the same workspace
      const targetList = await prisma.list.findUnique({
        where: { id: filteredUpdates.listId },
        include: {
          board: {
            include: {
              workspace: true
            }
          }
        }
      });

      if (!targetList || targetList.board.workspaceId !== workspaceId) {
        return new NextResponse("Invalid target list", { status: 400 });
      }
    }

    // Special handling for reordering cards
    if (filteredUpdates.order !== undefined) {
      const permissionCheck = await requirePermission(userId, workspaceId, 'REORDER_CARDS');
      
      if (!permissionCheck.success) {
        return new NextResponse(
          permissionCheck.error || "Cannot reorder cards", 
          { status: permissionCheck.status || 403 }
        );
      }
    }

    // Update the card
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: filteredUpdates,
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

    console.log(`[CARD_PATCH] Card ${cardId} updated by user ${userId} (role: ${await getUserWorkspaceRole(userId, workspaceId)})`);

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error("[CARD_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Delete a card by ID
export async function DELETE(
  req: Request,
  { params }: { params: { cardId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { cardId } = params;
    const userId = session.user.id;

    // Get the card to verify ownership and permissions
    const existingCard = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
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
        },
        assignees: {
          select: { id: true }
        }
      }
    });

    if (!existingCard) {
      return new NextResponse("Card not found", { status: 404 });
    }

    const workspaceId = existingCard.list.board.workspaceId;

    // Enhanced permission check using the new system
    const canDelete = await canDeleteCard(userId, cardId, workspaceId);
    
    if (!canDelete) {
      const userRole = await getUserWorkspaceRole(userId, workspaceId);
      return new NextResponse(
        `Insufficient permissions to delete this card. Your role: ${userRole || 'Not a member'}`, 
        { status: 403 }
      );
    }

    // Delete the card and reorder remaining cards in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete the card
      const deletedCard = await tx.card.delete({
        where: { id: cardId },
      });

      // Reorder remaining cards in the list
      const remainingCards = await tx.card.findMany({
        where: { listId: existingCard.listId },
        orderBy: { order: 'asc' },
      });

      // Update order for all remaining cards
      for (let i = 0; i < remainingCards.length; i++) {
        await tx.card.update({
          where: { id: remainingCards[i].id },
          data: { order: i },
        });
      }

      return deletedCard;
    });

    console.log(`[CARD_DELETE] Card ${cardId} deleted by user ${userId} (role: ${await getUserWorkspaceRole(userId, workspaceId)})`);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[CARD_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Get card details with permission check
export async function GET(
  req: Request,
  { params }: { params: { cardId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { cardId } = params;
    const userId = session.user.id;

    // Get the card with full details
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true
              }
            }
          }
        },
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

    if (!card) {
      return new NextResponse("Card not found", { status: 404 });
    }

    const workspaceId = card.list.board.workspaceId;

    // Check if user has permission to view boards (basic access check)
    const permissionCheck = await requirePermission(userId, workspaceId, 'VIEW_BOARD');
    
    if (!permissionCheck.success) {
      return new NextResponse(
        permissionCheck.error || "Cannot view this card", 
        { status: permissionCheck.status || 403 }
      );
    }

    // Add permission context to the response
    const userPermissions = {
      canEdit: await canEditCard(userId, cardId, workspaceId),
      canDelete: await canDeleteCard(userId, cardId, workspaceId),
      canMove: await requirePermission(userId, workspaceId, 'MOVE_CARDS').then((r: { success: any; }) => r.success),
      canReorder: await requirePermission(userId, workspaceId, 'REORDER_CARDS').then((r: { success: any; }) => r.success),
      canAssign: await requirePermission(userId, workspaceId, 'ASSIGN_CARD').then((r: { success: any; }) => r.success),
      userRole: await getUserWorkspaceRole(userId, workspaceId)
    };

    return NextResponse.json({
      ...card,
      permissions: userPermissions
    });
  } catch (error) {
    console.error("[CARD_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}