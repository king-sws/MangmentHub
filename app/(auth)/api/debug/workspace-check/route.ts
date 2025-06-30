// app/api/debug/workspace-check/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspace ID" }, { status: 400 });
  }

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId: session?.user?.id },
          select: { role: true }
        }
      }
    });

    return NextResponse.json({
      exists: !!workspace,
      isOwner: workspace?.userId === session?.user?.id,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: "Debug check failed" },
      { status: 500 }
    );
  }
}