import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { title, boardId } = await req.json();

    if (!title || !boardId) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const list = await prisma.list.create({
      data: {
        title,
        boardId,
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
    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get("boardId");

    if (!boardId) {
      return new NextResponse("Missing boardId", { status: 400 });
    }

    const lists = await prisma.list.findMany({
      where: {
        boardId,
      },
      orderBy: {
        order: "asc", // important for drag-and-drop later
      },
    });

    return NextResponse.json(lists);
  } catch (error) {
    console.error("[LIST_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
