import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Get the active workspace for the current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the user's workspace
    // This assumes the user has at least one workspace
    // You may need to modify this logic based on your app's requirements
    const workspace = await prisma.workspace.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc", // Get the most recently updated workspace
      },
    });

    if (!workspace) {
      return new NextResponse("No workspace found", { status: 404 });
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("[ACTIVE_WORKSPACE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}