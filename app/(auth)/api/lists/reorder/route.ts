import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { lists } = await req.json();

    if (!lists || !Array.isArray(lists) || lists.length === 0) {
      return new NextResponse("Invalid lists data", { status: 400 });
    }

    // Verify all list IDs exist and belong to the same board and user
    const listIds = lists.map(list => list.id);
    
    const dbLists = await prisma.list.findMany({
      where: {
        id: { in: listIds }
      },
      include: {
        board: {
          include: {
            workspace: true
          }
        }
      }
    });

    if (dbLists.length !== listIds.length) {
      return new NextResponse("One or more lists not found", { status: 404 });
    }

    // Check if all lists belong to the same board
    const boardId = dbLists[0].boardId;
    const userId = dbLists[0].board.workspace.userId;

    if (
      !dbLists.every(list => list.boardId === boardId) ||
      !dbLists.every(list => list.board.workspace.userId === userId) ||
      userId !== session.user.id
    ) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Update the order of each list
    const updates = lists.map(list => 
      prisma.list.update({
        where: { id: list.id },
        data: { order: list.order }
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LISTS_REORDER]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}