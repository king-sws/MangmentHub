// lib/permissions.ts - FIXED Professional Permission System
import { prisma } from "@/lib/prisma";

/**
 * Role hierarchy - Higher numbers = more permissions
 */
export const ROLES = {
  GUEST: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3
} as const;

/**
 * FIXED: Minimum role level required for each permission
 * This creates a proper hierarchy where higher roles inherit lower permissions
 */
export const PERMISSIONS: Record<string, number> = {
  // Workspace permissions - OWNER ONLY
  MANAGE_WORKSPACE: ROLES.OWNER,
  EDIT_WORKSPACE: ROLES.OWNER,
  DELETE_WORKSPACE: ROLES.OWNER,
  
  // Member management permissions
  INVITE_MEMBERS: ROLES.ADMIN,      // Admin+ can invite
  REMOVE_MEMBERS: ROLES.ADMIN,      // Admin+ can remove
  CHANGE_ROLES: ROLES.OWNER,        // Only owner can change roles
  VIEW_MEMBERS: ROLES.MEMBER,       // Member+ can view members
  
  // Board permissions
  CREATE_BOARD: ROLES.MEMBER,       // Member+ can create boards
  EDIT_BOARD: ROLES.MEMBER,         // Member+ can edit boards
  DELETE_BOARD: ROLES.ADMIN,        // Admin+ can delete boards (FIXED)
  VIEW_BOARD: ROLES.MEMBER,         // Member+ can view boards
  ARCHIVE_BOARD: ROLES.ADMIN,       // Admin+ can archive boards
  
  // List permissions
  CREATE_LIST: ROLES.MEMBER,        // Member+ can create lists
  EDIT_LIST: ROLES.MEMBER,          // Member+ can edit lists  
  DELETE_LIST: ROLES.ADMIN,         // Admin+ can delete lists (FIXED)
  REORDER_LISTS: ROLES.MEMBER,      // Member+ can reorder lists
  
  // Card permissions - More granular control
  CREATE_CARD: ROLES.MEMBER,        // Member+ can create cards
  EDIT_ANY_CARD: ROLES.ADMIN,       // Admin+ can edit any card
  EDIT_ASSIGNED_CARD: ROLES.MEMBER, // Member+ can edit assigned cards
  EDIT_OWN_CARD: ROLES.MEMBER,      // Member+ can edit own cards
  DELETE_ANY_CARD: ROLES.ADMIN,     // Admin+ can delete any card
  DELETE_OWN_CARD: ROLES.MEMBER,    // Member+ can delete own cards
  REORDER_CARDS: ROLES.MEMBER,      // Member+ can reorder cards
  MOVE_CARDS: ROLES.MEMBER,         // Member+ can move cards
  ASSIGN_CARD: ROLES.MEMBER,        // Member+ can assign cards
  
  // Advanced features - Admin/Owner only
  VIEW_ANALYTICS: ROLES.ADMIN,      // Admin+ can view analytics
  EXPORT_DATA: ROLES.ADMIN,         // Admin+ can export data
  MANAGE_INTEGRATIONS: ROLES.OWNER, // Owner only for integrations
  
  // Chat permissions
  SEND_MESSAGE: ROLES.MEMBER,       // Member+ can send messages
  DELETE_ANY_MESSAGE: ROLES.ADMIN,  // Admin+ can delete any message
  DELETE_OWN_MESSAGE: ROLES.MEMBER, // Member+ can delete own messages
  
  // System permissions
  VIEW_AUDIT_LOG: ROLES.ADMIN,      // Admin+ can view audit logs
  MANAGE_BILLING: ROLES.OWNER,      // Owner only for billing
};

export type Role = keyof typeof ROLES;
export type Permission = keyof typeof PERMISSIONS;

/**
 * Gets a user's role in a specific workspace
 */
export async function getUserWorkspaceRole(userId: string, workspaceId: string): Promise<Role | null> {
  try {
    console.log(`[DEBUG] Checking role for user: ${userId} in workspace: ${workspaceId}`);
    
    // First check if user is the workspace owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { 
        userId: true,
        name: true,
        id: true
      }
    });
    
    if (!workspace) {
      console.log(`[DEBUG] Workspace not found: ${workspaceId}`);
      return null;
    }
    
    if (workspace.userId === userId) {
      console.log(`[DEBUG] User is workspace owner`);
      return 'OWNER';
    }
    
    // Then check member role
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId
        }
      },
      select: { 
        role: true,
        userId: true,
        workspaceId: true
      }
    });
    
    if (!member) {
      console.log(`[DEBUG] No member record found for user: ${userId} in workspace: ${workspaceId}`);
      return null;
    }
    
    // Validate role exists in our ROLES enum
    const role = member.role as Role;
    if (!(role in ROLES)) {
      console.log(`[DEBUG] Invalid role found in database: ${member.role}`);
      return null;
    }
    
    console.log(`[DEBUG] Final role: ${role}`);
    return role;
  } catch (error) {
    console.error("[DEBUG] Error getting user workspace role:", error);
    return null;
  }
}

/**
 * FIXED: Proper hierarchical permission checking
 * Checks if a user has the minimum required role level for a permission
 */
export async function hasPermission(
  userId: string, 
  workspaceId: string, 
  permission: Permission
): Promise<boolean> {
  try {
    console.log(`[DEBUG] Checking permission: ${permission} for user: ${userId} in workspace: ${workspaceId}`);
    
    const userRole = await getUserWorkspaceRole(userId, workspaceId);
    
    if (!userRole || !(userRole in ROLES)) {
      console.log(`[DEBUG] No valid role found for user: ${userId}`);
      return false;
    }
    
    const userRoleLevel = ROLES[userRole];
    const requiredRoleLevel = PERMISSIONS[permission];
    
    console.log(`[DEBUG] User role: ${userRole} (level: ${userRoleLevel})`);
    console.log(`[DEBUG] Required role level for ${permission}: ${requiredRoleLevel}`);
    
    // FIXED: Check if user's role level meets or exceeds required level
    const hasAccess = userRoleLevel >= requiredRoleLevel;
    console.log(`[DEBUG] Permission check result: ${hasAccess}`);
    
    return hasAccess;
  } catch (error) {
    console.error("[DEBUG] Error checking permission:", error);
    return false;
  }
}

/**
 * ENHANCED: Check if user can edit a specific card with proper logic
 */
export async function canEditCard(userId: string, cardId: string, workspaceId: string): Promise<boolean> {
  try {
    // Check if user can edit any card (ADMIN/OWNER privilege)
    const canEditAny = await hasPermission(userId, workspaceId, 'EDIT_ANY_CARD');
    if (canEditAny) {
      console.log(`[DEBUG] User can edit any card (ADMIN+ privilege)`);
      return true;
    }
    
    // Get card details to check ownership and assignment
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        assignees: {
          select: { id: true }
        },
        // Add createdBy if you have this field in your schema
        // createdBy: { select: { id: true } }
      }
    });
    
    if (!card) {
      console.log(`[DEBUG] Card not found: ${cardId}`);
      return false;
    }
    
    // Check if card is assigned to user
    const isAssigned = card.assignees.some(assignee => assignee.id === userId);
    if (isAssigned) {
      const canEditAssigned = await hasPermission(userId, workspaceId, 'EDIT_ASSIGNED_CARD');
      console.log(`[DEBUG] Card is assigned to user, can edit assigned: ${canEditAssigned}`);
      return canEditAssigned;
    }
    
    // If you have a createdBy field, check if user created the card
    // if (card.createdBy?.id === userId) {
    //   const canEditOwn = await hasPermission(userId, workspaceId, 'EDIT_OWN_CARD');
    //   console.log(`[DEBUG] User created the card, can edit own: ${canEditOwn}`);
    //   return canEditOwn;
    // }
    
    // For now, fall back to general edit permission for own cards
    const canEditOwn = await hasPermission(userId, workspaceId, 'EDIT_OWN_CARD');
    console.log(`[DEBUG] Fallback to edit own card permission: ${canEditOwn}`);
    return canEditOwn;
  } catch (error) {
    console.error("Error checking card edit permission:", error);
    return false;
  }
}

/**
 * ENHANCED: Check if user can delete a specific card
 */
export async function canDeleteCard(userId: string, cardId: string, workspaceId: string): Promise<boolean> {
  try {
    // Check if user can delete any card (ADMIN/OWNER privilege)
    const canDeleteAny = await hasPermission(userId, workspaceId, 'DELETE_ANY_CARD');
    if (canDeleteAny) {
      console.log(`[DEBUG] User can delete any card (ADMIN+ privilege)`);
      return true;
    }
    
    // For deleting own cards, you'd need to track card ownership
    // This is a simplified version - consider adding createdBy field
    const canDeleteOwn = await hasPermission(userId, workspaceId, 'DELETE_OWN_CARD');
    console.log(`[DEBUG] Can delete own card: ${canDeleteOwn}`);
    return canDeleteOwn;
  } catch (error) {
    console.error("Error checking card delete permission:", error);
    return false;
  }
}

/**
 * Drag & Drop permission checks
 */
export async function canReorderCards(userId: string, workspaceId: string): Promise<boolean> {
  return await hasPermission(userId, workspaceId, 'REORDER_CARDS');
}

export async function canMoveCardsBetweenLists(userId: string, workspaceId: string): Promise<boolean> {
  return await hasPermission(userId, workspaceId, 'MOVE_CARDS');
}

export async function canReorderLists(userId: string, workspaceId: string): Promise<boolean> {
  return await hasPermission(userId, workspaceId, 'REORDER_LISTS');
}

/**
 * Role checking helpers
 */
export async function isMember(userId: string, workspaceId: string): Promise<boolean> {
  const role = await getUserWorkspaceRole(userId, workspaceId);
  return role !== null && ROLES[role] >= ROLES.MEMBER;
}

export async function isAdminOrOwner(userId: string, workspaceId: string): Promise<boolean> {
  const role = await getUserWorkspaceRole(userId, workspaceId);
  return role !== null && ROLES[role] >= ROLES.ADMIN;
}

export async function isOwner(userId: string, workspaceId: string): Promise<boolean> {
  const role = await getUserWorkspaceRole(userId, workspaceId);
  return role === 'OWNER';
}

/**
 * ENHANCED: Middleware function with better error messages
 */
export async function requirePermission(
  userId: string,
  workspaceId: string,
  permission: Permission
): Promise<{ success: boolean; error?: string; status?: number }> {
  console.log(`[DEBUG] requirePermission called with: userId=${userId}, workspaceId=${workspaceId}, permission=${permission}`);
  
  try {
    const userRole = await getUserWorkspaceRole(userId, workspaceId);
    
    if (!userRole) {
      console.log(`[DEBUG] User is not a member of workspace`);
      return {
        success: false,
        error: 'You are not a member of this workspace',
        status: 404
      };
    }
    
    const hasAccess = await hasPermission(userId, workspaceId, permission);
    
    if (!hasAccess) {
      const requiredRoleLevel = PERMISSIONS[permission];
      const requiredRoleName = Object.entries(ROLES).find(([, level]) => level === requiredRoleLevel)?.[0] || 'UNKNOWN';
      
      console.log(`[DEBUG] Access denied - user role: ${userRole}, required: ${requiredRoleName}`);
      
      return {
        success: false,
        error: `Insufficient permissions. This action requires ${requiredRoleName} role or higher. Your role: ${userRole}`,
        status: 403
      };
    }
    
    console.log(`[DEBUG] Permission granted for ${permission}`);
    return { success: true };
  } catch (error) {
    console.error("[DEBUG] Error in requirePermission:", error);
    return {
      success: false,
      error: 'Internal server error',
      status: 500
    };
  }
}

/**
 * ENHANCED: Get comprehensive user permissions with proper role hierarchy
 */
export async function getUserPermissions(userId: string, workspaceId: string) {
  try {
    const userRole = await getUserWorkspaceRole(userId, workspaceId);
    
    if (!userRole) {
      return null;
    }

    // Get all permissions based on user's role level
    const userRoleLevel = ROLES[userRole];
    
    const permissions = {
      // Workspace permissions (Owner only)
      canManageWorkspace: userRoleLevel >= PERMISSIONS.MANAGE_WORKSPACE,
      canEditWorkspace: userRoleLevel >= PERMISSIONS.EDIT_WORKSPACE,
      canDeleteWorkspace: userRoleLevel >= PERMISSIONS.DELETE_WORKSPACE,
      
      // Member permissions
      canInviteMembers: userRoleLevel >= PERMISSIONS.INVITE_MEMBERS,
      canRemoveMembers: userRoleLevel >= PERMISSIONS.REMOVE_MEMBERS,
      canChangeRoles: userRoleLevel >= PERMISSIONS.CHANGE_ROLES,
      canViewMembers: userRoleLevel >= PERMISSIONS.VIEW_MEMBERS,
      
      // Board permissions
      canCreateBoards: userRoleLevel >= PERMISSIONS.CREATE_BOARD,
      canEditBoards: userRoleLevel >= PERMISSIONS.EDIT_BOARD,
      canDeleteBoards: userRoleLevel >= PERMISSIONS.DELETE_BOARD,
      canViewBoards: userRoleLevel >= PERMISSIONS.VIEW_BOARD,
      canArchiveBoards: userRoleLevel >= PERMISSIONS.ARCHIVE_BOARD,
      
      // List permissions
      canCreateLists: userRoleLevel >= PERMISSIONS.CREATE_LIST,
      canEditLists: userRoleLevel >= PERMISSIONS.EDIT_LIST,
      canDeleteLists: userRoleLevel >= PERMISSIONS.DELETE_LIST,
      canReorderLists: userRoleLevel >= PERMISSIONS.REORDER_LISTS,
      
      // Card permissions
      canCreateCards: userRoleLevel >= PERMISSIONS.CREATE_CARD,
      canEditAnyCard: userRoleLevel >= PERMISSIONS.EDIT_ANY_CARD,
      canEditAssignedCard: userRoleLevel >= PERMISSIONS.EDIT_ASSIGNED_CARD,
      canEditOwnCard: userRoleLevel >= PERMISSIONS.EDIT_OWN_CARD,
      canDeleteAnyCard: userRoleLevel >= PERMISSIONS.DELETE_ANY_CARD,
      canDeleteOwnCard: userRoleLevel >= PERMISSIONS.DELETE_OWN_CARD,
      canReorderCards: userRoleLevel >= PERMISSIONS.REORDER_CARDS,
      canMoveCards: userRoleLevel >= PERMISSIONS.MOVE_CARDS,
      canAssignCards: userRoleLevel >= PERMISSIONS.ASSIGN_CARD,
      
      // Advanced features
      canViewAnalytics: userRoleLevel >= PERMISSIONS.VIEW_ANALYTICS,
      canExportData: userRoleLevel >= PERMISSIONS.EXPORT_DATA,
      canManageIntegrations: userRoleLevel >= PERMISSIONS.MANAGE_INTEGRATIONS,
      
      // Chat permissions
      canSendMessages: userRoleLevel >= PERMISSIONS.SEND_MESSAGE,
      canDeleteAnyMessage: userRoleLevel >= PERMISSIONS.DELETE_ANY_MESSAGE,
      canDeleteOwnMessage: userRoleLevel >= PERMISSIONS.DELETE_OWN_MESSAGE,
      
      // System permissions
      canViewAuditLog: userRoleLevel >= PERMISSIONS.VIEW_AUDIT_LOG,
      canManageBilling: userRoleLevel >= PERMISSIONS.MANAGE_BILLING,
    };

    return {
      role: userRole,
      roleLevel: userRoleLevel,
      permissions,
      isOwner: userRole === 'OWNER',
      isAdmin: userRole === 'ADMIN',
      isMember: userRole === 'MEMBER',
      isGuest: userRole === 'GUEST'
    };
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return null;
  }
}

/**
 * HELPER: Get role display information
 */
export function getRoleInfo(role: Role) {
  const roleDescriptions = {
    OWNER: "Full access to workspace management, billing, and all features",
    ADMIN: "Can manage members, delete boards/lists, and access analytics", 
    MEMBER: "Can create and edit boards, lists, and cards",
    GUEST: "Limited read-only access"
  };
  
  return {
    name: role,
    level: ROLES[role],
    description: roleDescriptions[role],
    color: role === 'OWNER' ? 'red' : role === 'ADMIN' ? 'orange' : role === 'MEMBER' ? 'blue' : 'gray'
  };
}