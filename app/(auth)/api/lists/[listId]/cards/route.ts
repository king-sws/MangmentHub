// api/lists/%5BlistId%5D/cards/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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

    if (!title) {
      return new NextResponse("Title is required", { status: 400 });
    }

    // Verify the list exists and belongs to the user's board
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        board: {
          include: {
            workspace: true
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

    if (list.board.workspace.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
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

    // Verify the list exists and belongs to the user's board
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        board: {
          include: {
            workspace: true
          }
        }
      }
    });

    if (!list) {
      return new NextResponse("List not found", { status: 404 });
    }

    if (list.board.workspace.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
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

    return NextResponse.json(cards);
  } catch (error) {
    console.error("[LIST_CARDS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}