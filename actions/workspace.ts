// Updated workspace actions with member limits
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { PlanType, getEffectivePlan, getWorkspaceLimit, getMemberLimit } from "@/lib/plans";

interface CreateWorkspaceInput {
  name: string;
}

interface WorkspaceWithLimits {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date | null;
  memberCount?: number;
  memberLimit?: number;
  canAddMembers?: boolean;
}

export async function getWorkspaces() {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  // Get user's subscription details
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      planExpires: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Get effective plan
  const effectivePlan = getEffectivePlan(user.plan as PlanType, user.planExpires);
  const memberLimit = getMemberLimit(effectivePlan);
  
  // Get workspaces where user is owner
  const ownedWorkspaces = await prisma.workspace.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: {
          members: true
        }
      }
    }
  });
  
  // Get workspaces where user is a member (but not owner)
  const memberWorkspaces = await prisma.workspaceMember.findMany({
    where: { 
      userId: session.user.id,
      workspaceId: {
        notIn: ownedWorkspaces.map(w => w.id)
      }
    },
    include: {
      workspace: {
        include: {
          _count: {
            select: {
              members: true
            }
          }
        }
      },
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Add subscription info to owned workspaces
  const ownedWithLimits: WorkspaceWithLimits[] = ownedWorkspaces.map(workspace => ({
    ...workspace,
    memberCount: workspace._count.members,
    memberLimit,
    canAddMembers: workspace._count.members < memberLimit
  }));

  // Add basic info to member workspaces (they don't control the subscription)
  const memberWithLimits: WorkspaceWithLimits[] = memberWorkspaces.map(m => ({
    ...m.workspace,
    memberCount: m.workspace._count.members,
  }));
  
  return [
    ...ownedWithLimits,
    ...memberWithLimits
  ];
}

export async function createWorkspace({ name }: CreateWorkspaceInput) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) throw new Error("Unauthorized");

  // Get user with plan details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      plan: true,
      planExpires: true,
    },
  });

  if (!user) throw new Error("User not found");

  // Get effective plan based on subscription status
  const effectivePlan = getEffectivePlan(user.plan as PlanType, user.planExpires);
  
  // Get workspace limit based on effective plan
  const limit = getWorkspaceLimit(effectivePlan);
  
  // Count existing workspaces
  const existingCount = await prisma.workspace.count({
    where: { userId },
  });

  if (existingCount >= limit) {
    throw new Error(`Workspace limit reached for your ${effectivePlan} plan (${existingCount}/${limit}). Please upgrade to create more workspaces.`);
  }

  const workspace = await prisma.workspace.create({
    data: { name, userId },
  });

  await prisma.workspaceMember.create({
    data: {
      userId,
      workspaceId: workspace.id,
      role: "OWNER",
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/workspace/[workspaceId]');

  return workspace;
}

export async function getWorkspaceWithSubscriptionInfo(workspaceId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Get workspace with owner details
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      user: {
        select: {
          plan: true,
          planExpires: true,
        }
      },
      _count: {
        select: {
          members: true
        }
      }
    }
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  // Check if user has access to this workspace
  const member = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
      workspaceId,
    },
  });

  if (!member) {
    throw new Error("Access denied");
  }

  // Get effective plan and limits
  const effectivePlan = getEffectivePlan(
    workspace.user.plan as PlanType, 
    workspace.user.planExpires
  );
  const memberLimit = getMemberLimit(effectivePlan);

  return {
    ...workspace,
    subscription: {
      plan: effectivePlan,
      memberLimit,
      currentMemberCount: workspace._count.members,
      canAddMembers: workspace._count.members < memberLimit,
      remainingSlots: Math.max(0, memberLimit - workspace._count.members),
      isOwner: workspace.userId === session.user.id
    }
  };
}

export async function renameWorkspace({ id, name }: { id: string; name: string }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.error("No user ID found in session");
      throw new Error("Authentication failed");
    }
    
    // Find and verify
    const workspace = await prisma.workspace.findUnique({ where: { id } });
    if (!workspace) {
      throw new Error("Workspace not found");
    }
    
    // Check if user is owner
    if (workspace.userId !== userId) {
      // Check if user is at least a member with permission
      const member = await prisma.workspaceMember.findFirst({
        where: { 
          userId,
          workspaceId: id,
          role: "OWNER" // You can expand this to check for other roles with permission
        }
      });
      
      if (!member) {
        throw new Error("Forbidden");
      }
    }
    
    // Update by id
    await prisma.workspace.update({
      where: { id },
      data: { name },
    });
    
    // Revalidate all relevant paths
    revalidatePath('/dashboard');
    revalidatePath('/workspace/[workspaceId]');
    
    return { success: true };
  } catch (error) {
    console.error("Failed to rename workspace:", error);
    throw error;
  }
}

export async function deleteWorkspace({ id }: { id: string }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      console.error("No user ID found in session");
      throw new Error("Authentication failed");
    }
    
    // Check if the workspace exists and belongs to the user
    const workspace = await prisma.workspace.findUnique({
      where: { id },
    });
    
    if (!workspace) {
      throw new Error("Workspace not found");
    }
    
    if (workspace.userId !== userId) {
      throw new Error("You don't have permission to delete this workspace");
    }
    
    // Delete all workspace members
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId: id },
    });
    
    // Delete all invitations
    await prisma.invitation.deleteMany({
      where: { workspaceId: id },
    });
    
    // Delete the workspace
    await prisma.workspace.delete({
      where: { id },
    });
    
    // Revalidate all relevant paths
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete workspace:", error);
    throw error;
  }
}