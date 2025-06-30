// api/invite/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PlanType, getEffectivePlan, getMemberLimit } from "@/lib/plans";

// GET - Verify invitation token and get invitation details
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  try {
    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        workspace: {
          include: {
            user: {
              select: {
                name: true,
                plan: true,
                planExpires: true
              }
            }
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Check current member count against subscription limits
    const currentMemberCount = await prisma.workspaceMember.count({
      where: { workspaceId: invitation.workspaceId }
    });

    const effectivePlan = getEffectivePlan(
      invitation.workspace.user.plan as PlanType,
      invitation.workspace.user.planExpires
    );
    const memberLimit = getMemberLimit(effectivePlan);

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        workspaceName: invitation.workspace.name,
        inviterName: invitation.workspace.user.name,
        expiresAt: invitation.expiresAt,
      },
      workspace: {
        id: invitation.workspace.id,
        name: invitation.workspace.name,
      },
      memberInfo: {
        currentCount: currentMemberCount,
        limit: memberLimit,
        canJoin: currentMemberCount < memberLimit,
        plan: effectivePlan
      }
    });

  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    );
  }
}

// POST - Accept invitation and join workspace
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be logged in to accept invitations" },
      { status: 401 }
    );
  }

  try {
    // Find the invitation with workspace and owner details
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        workspace: {
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
        }
      }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    if (invitation.expiresAt < new Date()) {
      // Clean up expired invitation
      await prisma.invitation.delete({
        where: { id: invitation.id }
      });
      
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: invitation.workspaceId
      }
    });

    if (existingMember) {
      // Clean up the invitation since user is already a member
      await prisma.invitation.delete({
        where: { id: invitation.id }
      });
      
      return NextResponse.json(
        { error: "You are already a member of this workspace" },
        { status: 400 }
      );
    }

    // Check subscription limits before adding the member
    const currentMemberCount = await prisma.workspaceMember.count({
      where: { workspaceId: invitation.workspaceId }
    });

    const effectivePlan = getEffectivePlan(
      invitation.workspace.user.plan as PlanType,
      invitation.workspace.user.planExpires
    );
    const memberLimit = getMemberLimit(effectivePlan);

    if (currentMemberCount >= memberLimit) {
      return NextResponse.json({
        error: `Cannot join workspace: member limit reached for ${effectivePlan} plan (${currentMemberCount}/${memberLimit}). The workspace owner needs to upgrade their plan.`,
        code: "MEMBER_LIMIT_EXCEEDED",
        currentCount: currentMemberCount,
        limit: memberLimit,
        plan: effectivePlan
      }, { status: 402 }); // 402 Payment Required
    }

    // Create the workspace membership
    const newMember = await prisma.workspaceMember.create({
      data: {
        userId: session.user.id,
        workspaceId: invitation.workspaceId,
        role: invitation.role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Delete the invitation since it's been accepted
    await prisma.invitation.delete({
      where: { id: invitation.id }
    });

    // You might want to send a notification to the workspace owner here
    // notifyMemberJoined(...);

    return NextResponse.json({
      success: true,
      member: newMember,
      workspace: newMember.workspace,
      message: `Successfully joined ${newMember.workspace.name}`
    });

  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}

// DELETE - Decline/reject invitation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  try {
    // Find and delete the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token }
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    await prisma.invitation.delete({
      where: { id: invitation.id }
    });

    return NextResponse.json({
      success: true,
      message: "Invitation declined"
    });

  } catch (error) {
    console.error("Error declining invitation:", error);
    return NextResponse.json(
      { error: "Failed to decline invitation" },
      { status: 500 }
    );
  }
}