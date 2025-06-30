import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { hasPermission, canEditCard, requirePermission } from "@/lib/permission";

// Create a new card
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { title, listId, description, dueDate, status, priority } = await req.json();
    
    if (!title || !listId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    
    // Get the list with workspace info to check permissions
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        board: {
          include: {
            workspace: {
              select: { id: true }
            }
          }
        },
        cards: {
          orderBy: { order: 'desc' },
          take: 1
        }
      },
    });
    
    if (!list) {
      return new NextResponse("List not found", { status: 404 });
    }

    // Use the permission system to check if user can create cards
    const permissionCheck = await requirePermission(
      session.user.id,
      list.board.workspace.id,
      'CREATE_CARD'
    );

    if (!permissionCheck.success) {
      return new NextResponse(
        permissionCheck.error || "Insufficient permissions",
        { status: permissionCheck.status || 403 }
      );
    }
    
    // Calculate the new order (highest existing order + 1, or 0 if no cards exist)
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
        priority: priority || null,
        // If you have a createdBy field, add it here:
      },
    });
    
    return NextResponse.json(card);
  } catch (error) {
    console.error("[CARD_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Update a card
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { id, title, description, dueDate, status, priority, completed } = await req.json();
    
    if (!id) {
      return new NextResponse("Card ID is required", { status: 400 });
    }
    
    // Get the card with full workspace info
    const existingCard = await prisma.card.findUnique({
      where: { id },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: {
                  select: { id: true }
                }
              }
            }
          }
        },
        // Include assignees if you have this relationship
        assignees: {
          select: { id: true }
        }
      }
    });
    
    if (!existingCard) {
      return new NextResponse("Card not found", { status: 404 });
    }

    const workspaceId = existingCard.list.board.workspace.id;

    // Use the enhanced card permission checking
    const canEdit = await canEditCard(session.user.id, id, workspaceId);
    
    if (!canEdit) {
      // Check if user has general edit permission
      const hasGeneralEdit = await hasPermission(session.user.id, workspaceId, 'EDIT_ANY_CARD');
      
      if (!hasGeneralEdit) {
        return new NextResponse(
          "Insufficient permissions: You can only edit cards assigned to you or that you created",
          { status: 403 }
        );
      }
    }
    
    // Update the card
    const updatedCard = await prisma.card.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority: priority || null }),
        ...(completed !== undefined && { completed }),
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error("[CARD_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Delete a card
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const cardId = searchParams.get('id');
    
    if (!cardId) {
      return new NextResponse("Card ID is required", { status: 400 });
    }
    
    // Get the card with workspace info
    const existingCard = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: {
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    });
    
    if (!existingCard) {
      return new NextResponse("Card not found", { status: 404 });
    }

    const workspaceId = existingCard.list.board.workspace.id;

    // Check delete permissions
    const canDeleteAny = await hasPermission(session.user.id, workspaceId, 'DELETE_ANY_CARD');
    const canDeleteOwn = await hasPermission(session.user.id, workspaceId, 'DELETE_OWN_CARD');
    
    if (!canDeleteAny && !canDeleteOwn) {
      return new NextResponse(
        "Insufficient permissions: You cannot delete cards",
        { status: 403 }
      );
    }

    // If user can't delete any card, check if they can delete own cards
    // Note: You'd need to implement ownership checking here if you have a createdBy field
    if (!canDeleteAny && canDeleteOwn) {
      // Add your ownership check logic here
      // For now, allowing the deletion if user has DELETE_OWN_CARD permission
      console.log("User has DELETE_OWN_CARD permission - implementing ownership check would be ideal");
    }
    
    // Delete the card
    await prisma.card.delete({
      where: { id: cardId }
    });
    
    return NextResponse.json({ success: true, message: "Card deleted successfully" });
  } catch (error) {
    console.error("[CARD_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}