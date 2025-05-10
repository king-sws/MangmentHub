/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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

    // Get the card to verify ownership
    const existingCard = await prisma.card.findUnique({
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

    if (!existingCard) {
      return new NextResponse("Card not found", { status: 404 });
    }

    // Check ownership
    if (existingCard.list.board.workspace.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Update the card
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: filteredUpdates,
    });

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

    // Get the card to verify ownership
    const existingCard = await prisma.card.findUnique({
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

    if (!existingCard) {
      return new NextResponse("Card not found", { status: 404 });
    }

    // Check ownership
    if (existingCard.list.board.workspace.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Delete the card
    const deletedCard = await prisma.card.delete({
      where: { id: cardId },
    });

    // Reorder remaining cards in the list
    await prisma.$transaction(async (tx) => {
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
    });

    return NextResponse.json(deletedCard);
  } catch (error) {
    console.error("[CARD_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}