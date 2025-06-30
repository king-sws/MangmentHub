// api/workspaces/[workspaceId]/debug/route.ts - Debug endpoint to check membership
import { auth } from "@/auth";
import { getUserWorkspaceRole } from "@/lib/permission";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const workspaceId = params.workspaceId;

    // Get all workspace data
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check if user is owner
    const isOwner = workspace.userId === userId;
    
    // Check if user is member
    const memberRecord = workspace.members.find(m => m.userId === userId);
    
    // Get role using the function
    const role = await getUserWorkspaceRole(userId, workspaceId);

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        ownerId: workspace.userId,
        createdAt: workspace.createdAt
      },
      user: {
        id: userId,
        isOwner,
        memberRecord,
        calculatedRole: role
      },
      allMembers: workspace.members.map(m => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        user: m.user
      }))
    });
  } catch (error) {
    console.error("[WORKSPACE_DEBUG] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch debug info" },
      { status: 500 }
    );
  }
}