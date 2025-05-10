// api/workspaces/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { workspaceId } = params;
    
    // Find the workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the owner
    const isOwner = workspace.userId === session.user.id;
    
    // If not owner, check if user is a member
    if (!isOwner) {
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          userId: session.user.id,
          workspaceId: workspaceId,
        },
      });
      
      if (!membership) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }
    
    // Return the workspace with the user's role
    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        isOwner: isOwner,
      },
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      );
    }

    // Create the workspace
    const workspace = await prisma.workspace.create({
      data: {
        name,
        userId: session.user.id,
      }
    });

    // Add the creator as an OWNER
    await prisma.workspaceMember.create({
      data: {
        userId: session.user.id,
        workspaceId: workspace.id,
        role: "OWNER"
      }
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Workspace creation error:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}