import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { cardId, newListId, newOrder } = await req.json();

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
                workspace: true
              }
            }
          }
        }
      }
    });

    if (!card) {
      return new NextResponse("Card not found", { status: 404 });
    }

    // Check ownership
    if (card.list.board.workspace.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Check if target list exists and is part of the same board
    const targetList = await prisma.list.findUnique({
      where: { id: newListId },
      include: {
        board: true
      }
    });

    if (!targetList || targetList.board.id !== card.list.board.id) {
      return new NextResponse("Invalid target list", { status: 400 });
    }

    const oldListId = card.listId;

    // Use a transaction to handle reordering
    await prisma.$transaction(async (tx) => {
      // If moving to a different list
      if (oldListId !== newListId) {
        // Step 1: Remove card from old list and update order of remaining cards
        await tx.card.update({
          where: { id: cardId },
          data: { listId: newListId, order: newOrder }
        });

        // Step 2: Get all cards from the old list and reorder them
        const oldListCards = await tx.card.findMany({
          where: { listId: oldListId },
          orderBy: { order: 'asc' }
        });

        // Update order of cards in the old list
        for (let i = 0; i < oldListCards.length; i++) {
          await tx.card.update({
            where: { id: oldListCards[i].id },
            data: { order: i }
          });
        }

        // Step 3: Make space in the new list for the card and update order of cards
        const newListCards = await tx.card.findMany({
          where: { 
            listId: newListId,
            id: { not: cardId } // Exclude the moved card
          },
          orderBy: { order: 'asc' }
        });

        // Update order of cards in the new list
        for (let i = 0, j = 0; i <= newListCards.length; i++) {
          if (i === newOrder) {
            continue; // Skip the position where the moved card will be
          }
          
          if (j < newListCards.length) {
            await tx.card.update({
              where: { id: newListCards[j].id },
              data: { order: i }
            });
            j++;
          }
        }
      } 
      // If just reordering within the same list
      else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const oldOrder = card.order;
        
        // Get all cards in the list
        const listCards = await tx.card.findMany({
          where: { 
            listId: newListId,
            id: { not: cardId } // Exclude the card being moved
          },
          orderBy: { order: 'asc' }
        });
        
        // Update the moved card's order
        await tx.card.update({
          where: { id: cardId },
          data: { order: newOrder }
        });
        
        // Reorder the other cards
        let index = 0;
        for (const c of listCards) {
          if (index === newOrder) {
            index++; // Skip the position where the moved card will be
          }
          
          await tx.card.update({
            where: { id: c.id },
            data: { order: index }
          });
          
          index++;
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CARD_REORDER]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}