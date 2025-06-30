// api/board/[boardId]/export/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkBoardAccess } from "@/lib/boardAccess";

export async function GET(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hasAccess } = await checkBoardAccess(params.boardId, userId);

    if (!hasAccess) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const board = await prisma.board.findUnique({
      where: { id: params.boardId },
      include: {
        workspace: {
          select: { id: true, name: true },
        },
        lists: {
          include: {
            cards: {
              include: {
                assignees: {
                  select: { id: true, name: true, email: true },
                },
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Format data for export
    const exportData = {
      board: {
        id: board.id,
        title: board.title,
        workspace: board.workspace.name,
        createdAt: board.createdAt,
        exportedAt: new Date().toISOString(),
      },
      lists: board.lists.map(list => ({
        id: list.id,
        title: list.title,
        order: list.order,
        cards: list.cards.map(card => ({
          id: card.id,
          title: card.title,
          description: card.description,
          status: card.status,
          completed: card.completed,
          dueDate: card.dueDate,
          assignees: card.assignees.map(assignee => ({
            name: assignee.name,
            email: assignee.email,
          })),
          createdAt: card.createdAt,
          completedAt: card.completedAt,
        })),
      })),
      summary: {
        totalLists: board.lists.length,
        totalCards: board.lists.reduce((acc, list) => acc + list.cards.length, 0),
        completedCards: board.lists.reduce(
          (acc, list) => acc + list.cards.filter(card => card.completed).length,
          0
        ),
      },
    };

    return NextResponse.json({
      success: true,
      data: exportData,
      filename: `${board.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export_${new Date().toISOString().split('T')[0]}.json`,
    });
  } catch (error) {
    console.error("[BOARD_EXPORT]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
