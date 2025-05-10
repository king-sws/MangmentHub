// api/board/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";


export async function POST(req: Request) {
  try {
    const { title, workspaceId } = await req.json();

    if (!title || !workspaceId) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const board = await prisma.board.create({
      data: {
        title,
        workspaceId,
      },
    });

    return NextResponse.json(board);
  } catch (error) {
    console.error("[BOARD_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}



export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return new NextResponse("Missing workspaceId", { status: 400 });
    }

    // ✅ validate ownership
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace || workspace.userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const boards = await prisma.board.findMany({
      where: { workspaceId },
      include: {
        workspace: true, // still include if needed on frontend
      },
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error("[BOARD_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
