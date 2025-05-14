// /app/(auth)/api/workspaces/user/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Find workspaces where the user is either the owner or a member
    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { userId },
          { members: { some: { userId } } }
        ]
      },
      select: {
        id: true,
        name: true,
        userId: true
      }
    });
    
    return NextResponse.json(workspaces);
  } catch (error) {
    console.error("[USER_WORKSPACES_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}