
// api/board/[boardId]/archive/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkBoardAccess } from "@/lib/boardAccess";

export async function POST(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hasAccess, isOwner } = await checkBoardAccess(params.boardId, userId);

    if (!hasAccess) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Only owners can archive boards
    if (!isOwner) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // For now, we'll use completedAt to mark as archived
    // You might want to add an isArchived boolean field to your schema
    const archivedBoard = await prisma.board.update({
      where: { id: params.boardId },
      data: {
        completedAt: new Date(),
      },
      include: {
        workspace: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: archivedBoard,
      message: "Board archived successfully",
    });
  } catch (error) {
    console.error("[BOARD_ARCHIVE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hasAccess, isOwner } = await checkBoardAccess(params.boardId, userId);

    if (!hasAccess) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Only owners can unarchive boards
    if (!isOwner) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const unarchivedBoard = await prisma.board.update({
      where: { id: params.boardId },
      data: {
        completedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: unarchivedBoard,
      message: "Board restored successfully",
    });
  } catch (error) {
    console.error("[BOARD_UNARCHIVE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}


