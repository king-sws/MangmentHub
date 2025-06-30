// lib/workspaceHelpers.ts
import { prisma } from "@/lib/prisma";

/**
 * Helper functions for workspace-related operations
 */

/**
 * Checks if a user has access to a workspace
 * @param userId The user ID to check
 * @param workspaceId The workspace ID to check
 * @returns Object containing access information
 */
export async function checkWorkspaceAccess(userId: string, workspaceId: string) {
  try {
    // Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });
    
    if (!workspace) {
      return {
        hasAccess: false,
        isOwner: false,
        error: "Workspace not found"
      };
    }
    
    const isOwner = workspace.userId === userId;
    
    // If user is owner, they have access
    if (isOwner) {
      return {
        hasAccess: true,
        isOwner: true,
        workspace
      };
    }
    
    // Check if user is a member
    const member = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId
      }
    });
    
    return {
      hasAccess: !!member,
      isOwner: false,
      isMember: !!member,
      memberRole: member?.role,
      workspace
    };
  } catch (error) {
    console.error("Error checking workspace access:", error);
    return {
      hasAccess: false,
      isOwner: false,
      error: (error as Error).message
    };
  }
}

/**
 * Lists all workspaces a user has access to
 * @param userId The user ID
 * @returns Array of workspaces
 */
export async function getUserWorkspaces(userId: string) {
  try {
    // Get workspaces where user is owner
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });
    
    // Get workspaces where user is a member
    const memberWorkspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId
          }
        },
        // Exclude workspaces the user owns (to avoid duplicates)
        NOT: {
          userId
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
            members: {
              where: {
                userId
              },
              select: {
                role: true
              }
            }
          }
        });
        
    // Combine and format the results
    const owned = ownedWorkspaces.map(w => ({
      ...w,
      role: "OWNER",
      isOwner: true
    }));
    
    const member = memberWorkspaces.map(w => ({
      ...w,
      role: w.members[0]?.role || "MEMBER",
      isOwner: false
    }));
    
    return [...owned, ...member].sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  } catch (error) {
    console.error("Error getting user workspaces:", error);
    throw error;
  }
}