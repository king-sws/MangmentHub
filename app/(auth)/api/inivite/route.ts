// app/(auth)/api/invite/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import crypto from "crypto";
import { sendInvitationEmail } from "@/nodemailer/email";

// POST - Create a new invitation
export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { email, workspaceId, role } = await req.json();

  try {
    // Authorization check - verify user is OWNER or ADMIN of workspace
    const currentMember = await prisma.workspaceMember.findFirst({
      where: { 
        workspaceId,
        userId: session.user.id,
        role: { in: ["OWNER", "ADMIN"] }
      }
    });
    
    if (!currentMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if user already exists
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (user) {
      const exists = await prisma.workspaceMember.findFirst({
        where: { workspaceId, userId: user.id }
      });
      
      if (exists) {
        return NextResponse.json({ error: "Already a member" }, { status: 400 });
      }
    }

    // Check for existing invitation
    const existingInvite = await prisma.invitation.findFirst({
      where: { email, workspaceId }
    });
    
    if (existingInvite) {
      return NextResponse.json({ error: "Invitation pending" }, { status: 400 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Create an invitation with token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    const invitation = await prisma.invitation.create({
      data: { 
        email, 
        workspaceId, 
        role: role || "MEMBER", 
        token, 
        expiresAt 
      }
    });

    // Send invitation email
    let emailDelivered = false;
    try {
      await sendInvitationEmail(
        email,
        workspace.name,
        `${process.env.NEXTAUTH_URL}/invite/${token}`
      );
      emailDelivered = true;
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
    }

    return NextResponse.json({ 
      success: true,
      invitation,
      emailDelivered
    });

  } catch (error) {
    console.error("Invitation error:", error);
    return NextResponse.json(
      { error: "Failed to process invitation" },
      { status: 500 }
    );
  }
}