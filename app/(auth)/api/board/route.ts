// api/board/route.ts - Fixed with proper permission system
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { requirePermission } from "@/lib/permission";

// Validation schemas
const createBoardSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  workspaceId: z.string().cuid("Invalid workspace ID"),
});

const getBoardsSchema = z.object({
  workspaceId: z.string().cuid("Invalid workspace ID"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = createBoardSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { title, workspaceId } = validation.data;

    // Use the centralized permission system
    const permissionCheck = await requirePermission(userId, workspaceId, 'CREATE_BOARD');
    
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status || 403 }
      );
    }

    // Get the next order number
    const lastBoard = await prisma.board.findFirst({
      where: { workspaceId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const nextOrder = (lastBoard?.order ?? 0) + 1;

    const board = await prisma.board.create({
      data: {
        title,
        workspaceId,
        order: nextOrder,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
        lists: {
          include: {
            cards: {
              select: {
                id: true,
                title: true,
                status: true,
                order: true,
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            lists: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: board,
      message: "Board created successfully",
    });
  } catch (error) {
    console.error("[BOARD_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId parameter is required" },
        { status: 400 }
      );
    }

    const validation = getBoardsSchema.safeParse({ workspaceId });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid workspace ID format" },
        { status: 400 }
      );
    }

    // Use centralized permission system
    const permissionCheck = await requirePermission(userId, workspaceId, 'VIEW_BOARD');
    
    if (!permissionCheck.success) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status || 403 }
      );
    }

    const boards = await prisma.board.findMany({
      where: { workspaceId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
        lists: {
          include: {
            _count: {
              select: {
                cards: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            lists: true,
          },
        },
      },
      orderBy: { order: "asc" },
    });

    // Add computed fields for better frontend handling
    const boardsWithStats = boards.map(board => ({
      ...board,
      totalCards: board.lists.reduce((acc, list) => acc + list._count.cards, 0),
      totalLists: board._count.lists,
    }));

    return NextResponse.json({
      success: true,
      data: boardsWithStats,
      count: boards.length,
    });
  } catch (error) {
    console.error("[BOARD_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}