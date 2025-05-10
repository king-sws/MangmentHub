// api/workspaces/[workspaceId]/members/[memberId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { workspaceId: string; memberId: string } }
) {
  const { workspaceId, memberId } = params;
  const session = await auth();
 
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if the current user has permission to update roles
    const currentMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id,
        role: "OWNER" // Only owners can change roles
      }
    });
    
    if (!currentMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    const { role } = await req.json();
   
    // Validate role
    if (!["ADMIN", "MEMBER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    
    // Check if trying to update the owner
    const targetMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: memberId,
      }
    });
    
    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    
    if (targetMember.role === "OWNER") {
      return NextResponse.json({ error: "Cannot change owner's role" }, { status: 400 });
    }
    
    // Update the member's role
    const updatedMember = await prisma.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId
        }
      },
      data: { role }
    });
    
    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Role update error:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}