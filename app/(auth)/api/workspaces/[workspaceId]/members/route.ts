// Updated api/workspaces/[workspaceId]/members/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import crypto from "crypto";
import { sendInvitationEmail } from "@/nodemailer/email";
import { 
  notifyInvitation, 
  notifyNewMember, 
  notifyRoleChange 
} from "@/lib/notifications";
import { PlanType, getEffectivePlan, getMemberLimit } from "@/lib/plans";

// GET — List all members and invitations
export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const { workspaceId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get workspace with owner details
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        user: {
          select: {
            plan: true,
            planExpires: true,
          }
        }
      }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Get effective plan and member limit
    const effectivePlan = getEffectivePlan(
      workspace.user.plan as PlanType, 
      workspace.user.planExpires
    );
    const memberLimit = getMemberLimit(effectivePlan);

    // Get all members of the workspace
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
    });

    // Get pending invitations
    const invitations = await prisma.invitation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    // Get current user's role in the workspace
    const currentMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId,
        },
      },
    });

    // Return all needed data including subscription info
    return NextResponse.json({
      members,
      invitations,
      currentUserRole: currentMember?.role || "MEMBER",
      subscription: {
        plan: effectivePlan,
        memberLimit,
        currentMemberCount: members.length,
        canAddMore: members.length < memberLimit,
        remainingSlots: Math.max(0, memberLimit - members.length)
      }
    });
  } catch (error) {
    console.error("Error fetching workspace data:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace data" },
      { status: 500 }
    );
  }
}

// POST — Invite new member with subscription limits
export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const { workspaceId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { email, role } = await req.json();

  try {
    // Authorization check
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

    // Get workspace with owner subscription details
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        user: {
          select: { 
            id: true, 
            name: true,
            plan: true,
            planExpires: true
          }
        }
      }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check subscription limits
    const effectivePlan = getEffectivePlan(
      workspace.user.plan as PlanType, 
      workspace.user.planExpires
    );
    const memberLimit = getMemberLimit(effectivePlan);

    // Count current members
    const currentMemberCount = await prisma.workspaceMember.count({
      where: { workspaceId }
    });

    // Check if adding this member would exceed the limit
    if (currentMemberCount >= memberLimit) {
      return NextResponse.json({ 
        error: `Member limit reached for ${effectivePlan} plan (${currentMemberCount}/${memberLimit}). Please upgrade to add more members.`,
        code: "MEMBER_LIMIT_EXCEEDED",
        limit: memberLimit,
        current: currentMemberCount,
        plan: effectivePlan
      }, { status: 403 });
    }

    // Get the inviter's name
    const inviterName = session.user.name || "A workspace admin";

    // Existing user check
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (user) {
      const exists = await prisma.workspaceMember.findFirst({
        where: { workspaceId, userId: user.id }
      });
      
      if (exists) {
        return NextResponse.json({ error: "Already a member" }, { status: 400 });
      }

      // Add the user directly
      const newMember = await prisma.workspaceMember.create({
        data: { 
          userId: user.id, 
          workspaceId, 
          role: role || "MEMBER" 
        }
      });
      
      // Notify workspace owner about the new member
      await notifyNewMember({
        workspaceId,
        workspaceName: workspace.name,
        memberId: user.id,
        memberName: user.name || email,
        ownerId: workspace.userId
      });
      
      return NextResponse.json({ 
        success: true, 
        member: newMember,
        subscription: {
          plan: effectivePlan,
          memberLimit,
          currentMemberCount: currentMemberCount + 1,
          remainingSlots: memberLimit - (currentMemberCount + 1)
        }
      });
    }

    // For non-existing users, create an invitation
    const existingInvite = await prisma.invitation.findFirst({
      where: { email, workspaceId }
    });
    
    if (existingInvite) {
      return NextResponse.json({ error: "Invitation pending" }, { status: 400 });
    }

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

    // Create notification for user if they exist in system
    await notifyInvitation({
      email,
      workspaceName: workspace.name,
      inviterName,
      inviterId: session.user.id,
      workspaceId
    });

    // Try to send email, but don't fail if it doesn't work
    let emailDelivered = false;
    try {
      await sendInvitationEmail(
        email,
        workspace.name || "Our Workspace",
        `${process.env.NEXTAUTH_URL}/invite/${token}`
      );
      emailDelivered = true;
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
    }

    return NextResponse.json({ 
      success: true,
      invitation,
      emailDelivered,
      subscription: {
        plan: effectivePlan,
        memberLimit,
        currentMemberCount: currentMemberCount,
        remainingSlots: memberLimit - currentMemberCount - 1 // -1 for the pending invitation
      }
    });

  } catch (error) {
    console.error("Invitation error:", error);
    return NextResponse.json(
      { error: "Failed to process invitation" },
      { status: 500 }
    );
  }
}

// PATCH — Update member role (unchanged, but could add subscription checks)
export async function PATCH(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const { workspaceId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { userId, role } = await req.json();

  try {
    // Check if the current user has permission (must be owner)
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

    // Validate role
    if (!["ADMIN", "MEMBER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if target member exists
    const targetMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
      },
      include: {
        user: true
      }
    });
    
    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Can't change owner's role
    if (targetMember.role === "OWNER") {
      return NextResponse.json({ error: "Cannot change owner's role" }, { status: 400 });
    }

    // Get workspace name for notification
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Update the member's role
    const updatedMember = await prisma.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId
        }
      },
      data: { role }
    });

    // Create notification for the user about their role change
    await notifyRoleChange({
      userId,
      workspaceId,
      workspaceName: workspace.name,
      newRole: role,
      changedById: session.user.id,
      changedByName: session.user.name || "Workspace owner"
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

// DELETE — Remove member or cancel invitation (unchanged)
export async function DELETE(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const { workspaceId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { memberId, invitationId } = await req.json();

  try {
    // Check permissions (OWNER or ADMIN)
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

    // Handle member removal
    if (memberId) {
      if (session.user.id === memberId) {
        return NextResponse.json(
          { error: "Can't remove yourself" },
          { status: 400 }
        );
      }

      const targetMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: memberId,
            workspaceId
          }
        }
      });

      if (targetMember?.role === "OWNER" && currentMember.role !== "OWNER") {
        return NextResponse.json(
          { error: "Only owners can remove other owners" },
          { status: 403 }
        );
      }

      await prisma.workspaceMember.delete({
        where: {
          userId_workspaceId: {
            userId: memberId,
            workspaceId
          }
        }
      });

      return NextResponse.json({ success: true });
    }
    
    // Handle invitation cancellation
    if (invitationId) {
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId }
      });
      
      if (!invitation || invitation.workspaceId !== workspaceId) {
        return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
      }

      await prisma.invitation.delete({
        where: { id: invitationId }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Either memberId or invitationId must be provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Delete operation error:", error);
    return NextResponse.json(
      { error: "Failed to process deletion" },
      { status: 500 }
    );
  }
}