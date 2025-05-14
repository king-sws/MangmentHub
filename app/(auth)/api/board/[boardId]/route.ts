// api/board/[boardId]/route.ts
import { auth } from "@/auth";
import  { prisma }  from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET board by ID (with user ownership check)
export async function GET(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const board = await prisma.board.findUnique({
      where: {
        id: params.boardId,
      },
      include: {
        workspace: true,
        lists: true,
      },
    });

    if (!board || board.workspace.userId !== session.user.id) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error("[BOARD_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH board by ID
export async function PATCH(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title } = await req.json();

    const existingBoard = await prisma.board.findUnique({
      where: { id: params.boardId },
      include: { workspace: true },
    });

    if (!existingBoard || existingBoard.workspace.userId !== userId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const updated = await prisma.board.update({
      where: { id: params.boardId },
      data: { title },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[BOARD_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE board by ID
export async function DELETE(
  req: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const existingBoard = await prisma.board.findUnique({
      where: { id: params.boardId },
      include: { workspace: true },
    });

    if (!existingBoard || existingBoard.workspace.userId !== userId) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const deleted = await prisma.board.delete({
      where: { id: params.boardId },
    });

    return NextResponse.json(deleted);
  } catch (error) {
    console.error("[BOARD_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
