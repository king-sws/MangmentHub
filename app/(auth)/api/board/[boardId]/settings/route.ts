// api/board/[boardId]/settings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

const boardSettingsSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isArchived: z.boolean().optional(),
  backgroundColor: z.string().optional(),
  isPublic: z.boolean().optional(),
});

async function checkBoardAccess(boardId: string, userId: string) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!board) return { hasAccess: false, isOwner: false, board: null };

  const isOwner = board.workspace.userId === userId;
  const isMember = board.workspace.members.length > 0;
  const hasAccess = isOwner || isMember;

  return { hasAccess, isOwner, board };
}

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

    const { hasAccess, board } = await checkBoardAccess(params.boardId, userId);

    if (!hasAccess || !board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: board.id,
        title: board.title,
        createdAt: board.createdAt,
        updatedAt: board.updatedAt,
        workspace: {
          id: board.workspace.id,
          name: board.workspace.name,
        },
        
      },
    });
  } catch (error) {
    console.error("[BOARD_SETTINGS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = boardSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { hasAccess, isOwner } = await checkBoardAccess(params.boardId, userId);

    if (!hasAccess) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Only owners can modify board settings
    if (!isOwner) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const updatedBoard = await prisma.board.update({
      where: { id: params.boardId },
      data: validation.data,
      include: {
        workspace: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedBoard,
      message: "Board settings updated successfully",
    });
  } catch (error) {
    console.error("[BOARD_SETTINGS_PATCH]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
