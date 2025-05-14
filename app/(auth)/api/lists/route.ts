// /api/lists/route.ts - Fixed API route
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, boardId } = await req.json();

    if (!title || !boardId) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    // Verify board exists and user has access
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { workspace: true },
    });

    if (!board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    if (board.workspace.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Get max order to place new list at the end
    const maxOrderList = await prisma.list.findFirst({
      where: { boardId },
      orderBy: { order: 'desc' },
    });

    const newOrder = maxOrderList ? maxOrderList.order + 1 : 0;

    const list = await prisma.list.create({
      data: {
        title,
        boardId,
        order: newOrder,
      },
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error("[LIST_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get("boardId");

    if (!boardId) {
      return new NextResponse("Missing boardId", { status: 400 });
    }

    // Verify board exists and user has access
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { workspace: true },
    });

    if (!board) {
      return new NextResponse("Board not found", { status: 404 });
    }

    if (board.workspace.userId !== session.user.id) {
      // Check if user is a member of the workspace
      const isMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: board.workspace.id,
          userId: session.user.id,
        },
      });

      if (!isMember) {
        return new NextResponse("Unauthorized", { status: 403 });
      }
    }

    const lists = await prisma.list.findMany({
      where: {
        boardId,
      },
      orderBy: {
        order: "asc",
      },
      include: {
        // Include count of cards for each list
        _count: {
          select: {
            cards: true,
          },
        },
      },
    });

    // Add proper logging to help debug
    console.log(`Found ${lists.length} lists for board ${boardId}`);

    return NextResponse.json(lists);
  } catch (error) {
    console.error("[LIST_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}