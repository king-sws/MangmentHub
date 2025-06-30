// 2. Workspace member creation helper
// Create a new file: app/api/debug/add-workspace-member/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { workspaceId, userId, role = "MEMBER" } = body;
    
    if (!workspaceId || !userId) {
      return NextResponse.json({ error: "workspaceId and userId are required" }, { status: 400 });
    }

    // Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });
    
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check if user is the workspace owner
    if (workspace.userId !== session.user.id) {
      return NextResponse.json({ error: "Only workspace owner can add members" }, { status: 403 });
    }

    // Check if member record already exists
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId
      }
    });

    if (existingMember) {
      return NextResponse.json({ 
        message: "User is already a member of this workspace",
        member: existingMember
      });
    }

    // Add the user as a workspace member
    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role: role as "MEMBER" | "ADMIN"
      }
    });

    return NextResponse.json({
      success: true,
      message: "User added as workspace member",
      member
    });
  } catch (error) {
    console.error("Error adding workspace member:", error);
    return NextResponse.json(
      { error: "Failed to add workspace member", details: (error as Error).message },
      { status: 500 }
    );
  }
}