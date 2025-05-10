// app/(auth)/api/invitations/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Get the token from the URL parameters
    const { token } = params;
    
    if (!token) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 400 }
      );
    }
    
    // Find the invitation in the database
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            name: true,
          },
        },
      },
    });
    
    // Check if invitation exists
    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }
    
    // Check if invitation has expired
    if (new Date() > invitation.expiresAt) {
      // Delete expired invitation
      await prisma.invitation.delete({
        where: { id: invitation.id },
      });
      
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 410 }
      );
    }
    
    // Return the invitation details
    return NextResponse.json({
      email: invitation.email,
      workspaceName: invitation.workspace.name,
      workspaceId: invitation.workspaceId,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation details" },
      { status: 500 }
    );
  }
}