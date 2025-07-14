// app/api/workspaces/user/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
   
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
   
    const { userId } = params;
   
    // Ensure user can only access their own workspaces
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
   
    // Get workspaces where user is owner
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { userId: userId },
      select: {
        id: true,
        name: true,
        userId: true,
      }
    });
   
    // Get workspaces where user is a member
    const memberWorkspaces = await prisma.workspaceMember.findMany({
      where: { userId: userId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            userId: true,
          }
        }
      }
    });
   
    // Combine and format the results
    const allWorkspaces = [
      ...ownedWorkspaces.map(ws => ({
        id: ws.id,
        name: ws.name,
        isOwner: true,
      })),
      ...memberWorkspaces.map(member => ({
        id: member.workspace.id,
        name: member.workspace.name,
        isOwner: false,
      }))
    ];
   
    // Remove duplicates (in case user is both owner and member)
    const uniqueWorkspaces = allWorkspaces.filter((ws, index, self) =>
      index === self.findIndex(w => w.id === ws.id)
    );
   
    return NextResponse.json(uniqueWorkspaces, { status: 200 });
   
  } catch (error) {
    console.error("Error fetching user workspaces:", error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}