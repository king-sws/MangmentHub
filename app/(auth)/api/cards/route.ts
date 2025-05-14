// api/cards/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Create a new card
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { title, listId, description, dueDate, status } = await req.json();
    
    if (!title || !listId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    
    // Verify the list exists and get the current maximum order
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        board: {
          include: {
            workspace: {
              include: {
                members: true // Include the workspace members
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
      },
    });
    
    if (!list) {
      return new NextResponse("List not found", { status: 404 });
    }
    
    // Check if user is either the owner or a member of the workspace
    const isOwner = list.board.workspace.userId === session.user.id;
    const isMember = list.board.workspace.members.some(
      member => member.userId === session.user.id
    );
    
    if (!isOwner && !isMember) {
      return new NextResponse("Unauthorized: You must be an owner or member of this workspace", { status: 403 });
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
      },
    });
    
    return NextResponse.json(card);
  } catch (error) {
    console.error("[CARD_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}