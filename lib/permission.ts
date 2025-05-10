// lib/permissions.ts
import { prisma } from "@/lib/prisma";

/**
 * Role hierarchy and permissions configuration
 */
export const ROLES = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
  GUEST: 0
};

export const PERMISSIONS = {
  // Workspace permissions
  MANAGE_WORKSPACE: [ROLES.OWNER],
  EDIT_WORKSPACE: [ROLES.OWNER, ROLES.ADMIN],
  
  // Member permissions
  INVITE_MEMBERS: [ROLES.OWNER, ROLES.ADMIN],
  REMOVE_MEMBERS: [ROLES.OWNER, ROLES.ADMIN],
  CHANGE_ROLES: [ROLES.OWNER],
  
  // Content permissions
  CREATE_CONTENT: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER],
  EDIT_ANY_CONTENT: [ROLES.OWNER, ROLES.ADMIN],
  EDIT_OWN_CONTENT: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER],
  DELETE_ANY_CONTENT: [ROLES.OWNER, ROLES.ADMIN],
  DELETE_OWN_CONTENT: [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER]
};

/**
 * Gets a user's role in a specific workspace
 */
export async function getUserWorkspaceRole(userId: string, workspaceId: string) {
  try {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId
        }
      }
    });
    
    return member?.role || null;
  } catch (error) {
    console.error("Error getting user workspace role:", error);
    return null;
  }
}

/**
 * Checks if a user has permission to perform an action in a workspace
 */
export async function hasPermission(userId: string, workspaceId: string, permission: keyof typeof PERMISSIONS) {
  const userRole = await getUserWorkspaceRole(userId, workspaceId);
  
  if (!userRole || !(userRole in ROLES)) {
    return false;
  }
  
  const userRoleLevel = ROLES[userRole as keyof typeof ROLES];
  const allowedRoles = PERMISSIONS[permission];
  
  // Check if any of the user's roles have the required permission
  for (const role of allowedRoles) {
    if (userRoleLevel >= role) {
      return true;
    }
  }
  
  return false;
}

/**
 * Checks if user is at least a member of the workspace
 */
export async function isMember(userId: string, workspaceId: string) {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId
      }
    }
  });
  
  return !!member;
}