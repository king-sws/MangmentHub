// app/api/debug/workspace-membership/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // Get the workspaceId from the query parameter
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get("workspaceId");
    
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }
    
    console.log('[DEBUG] Received workspaceId:', workspaceId);

    // Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    console.log('[DEBUG] Workspace query result:', workspace);
    
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Add explicit owner check
    const isOwner = workspace.userId === session.user.id;

    // Check if user is a member of the workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id
      }
    });
    
    // If user is owner but not in members table, auto-add them
    if (isOwner && !workspaceMember) {
      await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: session.user.id,
          role: "OWNER"
        }
      });

      // Re-fetch the member after creation
      const updatedMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: session.user.id
        }
      });
      
      // Return the updated membership status
      return NextResponse.json({
        workspaceId,
        userId: session.user.id,
        isWorkspaceOwner: isOwner,
        isMember: true,
        memberDetails: updatedMember
      });
    }
        
    // Return the membership status
    return NextResponse.json({
      workspaceId,
      userId: session.user.id,
      isWorkspaceOwner: isOwner,
      isMember: !!workspaceMember,
      memberDetails: workspaceMember
    });
    
  } catch (error) {
    console.error("Error checking workspace membership:", error);
    return NextResponse.json(
      { error: "Failed to check workspace membership", details: (error as Error).message },
      { status: 500 }
    );
  }
}