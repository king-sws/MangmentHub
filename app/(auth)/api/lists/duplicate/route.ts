// api/lists/duplicate/route.ts - List Duplication with Permission System
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { requirePermission, getUserWorkspaceRole } from "@/lib/permission";

const listDuplicateSchema = z.object({
  listId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // Get and validate the request body
    const body = await req.json();
    const validatedData = listDuplicateSchema.safeParse(body);
   
    if (!validatedData.success) {
      return new NextResponse(
        JSON.stringify({ error: validatedData.error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { listId } = validatedData.data;

    // Get the original list with all its cards and workspace info
    const originalList = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        board: {
          include: {
            workspace: true
          }
        },
        cards: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!originalList) {
      return new NextResponse("List not found", { status: 404 });
    }

    const workspaceId = originalList.board.workspaceId;

    // Check permissions - user needs CREATE_LIST permission to duplicate
    const permissionCheck = await requirePermission(userId, workspaceId, 'CREATE_LIST');
    
    if (!permissionCheck.success) {
      return new NextResponse(
        permissionCheck.error || "Cannot duplicate lists in this workspace", 
        { status: permissionCheck.status || 403 }
      );
    }

    // Get the highest order number for lists in this board to place the duplicate at the end
    const maxOrderList = await prisma.list.findFirst({
      where: { boardId: originalList.boardId },
      orderBy: { order: 'desc' },
    });

    const newListOrder = maxOrderList ? maxOrderList.order + 1 : 0;

    // Create the duplicate list and cards in a transaction
    const duplicatedList = await prisma.$transaction(async (tx) => {
      // Create the new list
      const newList = await tx.list.create({
        data: {
          title: `${originalList.title} (Copy)`,
          boardId: originalList.boardId,
          order: newListOrder,
        },
      });

      // Create duplicate cards if any exist
      if (originalList.cards.length > 0) {
        const cardsToCreate = originalList.cards.map((card) => ({
          title: card.title,
          description: card.description,
          listId: newList.id,
          order: card.order,
          status: card.status, // Copy the status
          dueDate: card.dueDate, // Copy the due date
          priority: card.priority, // Copy the priority
          // Note: We don't copy assigneeId for security reasons
          // You can add this if needed based on your requirements
          
        }));

        await tx.card.createMany({
          data: cardsToCreate,
        });
      }

      // Return the new list with card count
      return await tx.list.findUnique({
        where: { id: newList.id },
        include: {
          _count: {
            select: {
              cards: true,
            },
          },
        },
      });
    });

    console.log(`[LIST_DUPLICATE] List "${originalList.title}" duplicated as "${duplicatedList?.title}" by user ${userId} (role: ${await getUserWorkspaceRole(userId, workspaceId)})`);

    return NextResponse.json({
      success: true,
      message: "List duplicated successfully",
      duplicatedList
    });

  } catch (error) {
    console.error("[LIST_DUPLICATE]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}