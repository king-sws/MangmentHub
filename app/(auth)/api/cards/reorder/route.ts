// api/cards/reorder/route.ts - Enhanced Card Reorder with Permission System
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { 
  canMoveCardsBetweenLists,
  canReorderCards,
  getUserWorkspaceRole 
} from "@/lib/permission";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { cardId, newListId, newOrder } = await req.json();
    const userId = session.user.id;

    if (!cardId || !newListId || typeof newOrder !== 'number') {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get the card to verify ownership and current position
    const card = await prisma.card.findUnique({
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
        }
      }
    });

    if (!card) {
      return new NextResponse("Card not found", { status: 404 });
    }

    const workspaceId = card.list.board.workspaceId;
    const oldListId = card.listId;
    const isMovingBetweenLists = oldListId !== newListId;

    // Enhanced permission checks
    if (isMovingBetweenLists) {
      // Check if user can move cards between lists
      const canMove = await canMoveCardsBetweenLists(userId, workspaceId);
      if (!canMove) {
        const userRole = await getUserWorkspaceRole(userId, workspaceId);
        return new NextResponse(
          `Cannot move cards between lists. Your role: ${userRole || 'Not a member'}`,
          { status: 403 }
        );
      }
    } else {
      // Check if user can reorder cards within the same list
      const canReorder = await canReorderCards(userId, workspaceId);
      if (!canReorder) {
        const userRole = await getUserWorkspaceRole(userId, workspaceId);
        return new NextResponse(
          `Cannot reorder cards. Your role: ${userRole || 'Not a member'}`,
          { status: 403 }
        );
      }
    }

    // Check if target list exists and is part of the same board
    const targetList = await prisma.list.findUnique({
      where: { id: newListId },
      include: {
        board: {
          include: {
            workspace: true
          }
        }
      }
    });

    if (!targetList || targetList.board.id !== card.list.board.id) {
      return new NextResponse("Invalid target list", { status: 400 });
    }

    // Verify target list is in the same workspace
    if (targetList.board.workspaceId !== workspaceId) {
      return new NextResponse("Target list is not in the same workspace", { status: 400 });
    }

    // Use a transaction to handle reordering
    const result = await prisma.$transaction(async (tx) => {
      // If moving to a different list
      if (isMovingBetweenLists) {
        // Step 1: Move card to new list with new order
        await tx.card.update({
          where: { id: cardId },
          data: { listId: newListId, order: newOrder }
        });

        // Step 2: Reorder cards in the old list
        const oldListCards = await tx.card.findMany({
          where: { listId: oldListId },
          orderBy: { order: 'asc' }
        });

        // Update order of remaining cards in the old list
        for (let i = 0; i < oldListCards.length; i++) {
          await tx.card.update({
            where: { id: oldListCards[i].id },
            data: { order: i }
          });
        }

        // Step 3: Reorder cards in the new list
        const newListCards = await tx.card.findMany({
          where: { 
            listId: newListId,
            id: { not: cardId } // Exclude the moved card
          },
          orderBy: { order: 'asc' }
        });

        // Update order of cards in the new list
        let currentOrder = 0;
        for (const listCard of newListCards) {
          if (currentOrder === newOrder) {
            currentOrder++; // Skip the position where the moved card is
          }
          
          await tx.card.update({
            where: { id: listCard.id },
            data: { order: currentOrder }
          });
          
          currentOrder++;
        }
      } 
      // If just reordering within the same list
      else {
        // Get all cards in the list except the one being moved
        const listCards = await tx.card.findMany({
          where: { 
            listId: newListId,
            id: { not: cardId }
          },
          orderBy: { order: 'asc' }
        });
        
        // Update the moved card's order
        await tx.card.update({
          where: { id: cardId },
          data: { order: newOrder }
        });
        
        // Reorder the other cards
        let currentOrder = 0;
        for (const listCard of listCards) {
          if (currentOrder === newOrder) {
            currentOrder++; // Skip the position where the moved card is
          }
          
          await tx.card.update({
            where: { id: listCard.id },
            data: { order: currentOrder }
          });
          
          currentOrder++;
        }
      }

      // Return the updated card with full details
      return await tx.card.findUnique({
        where: { id: cardId },
        include: {
          assignees: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          },
          list: {
            select: {
              id: true,
              title: true,
              boardId: true
            }
          }
        }
      });
    });

    console.log(`[CARD_REORDER] Card ${cardId} ${isMovingBetweenLists ? 'moved' : 'reordered'} by user ${userId} (role: ${await getUserWorkspaceRole(userId, workspaceId)})`);

    return NextResponse.json({
      success: true,
      card: result,
      action: isMovingBetweenLists ? 'moved' : 'reordered'
    });
  } catch (error) {
    console.error("[CARD_REORDER]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}