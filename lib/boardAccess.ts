// lib/boardAccess.ts - Fixed Board Access Control
import { prisma } from "@/lib/prisma";
import { getUserWorkspaceRole, hasPermission, Permission } from "./permission";

export async function checkBoardAccess(
  boardId: string,
  userId: string,
  requiredPermission: Permission = 'VIEW_BOARD'
) {
  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: {
        id: true,
        title: true,
        workspaceId: true,
        workspace: {
          select: {
            id: true,
            name: true,
            userId: true
          }
        }
      }
    });

    if (!board) {
      return {
        hasAccess: false,
        error: 'Board not found',
        status: 404,
        board: null,
        userRole: null
      };
    }

    const userRole = await getUserWorkspaceRole(userId, board.workspaceId);
    const hasAccess = await hasPermission(userId, board.workspaceId, requiredPermission);

    return {
      hasAccess,
      error: hasAccess ? null : 'Insufficient permissions',
      status: hasAccess ? 200 : (userRole ? 403 : 404),
      board,
      userRole,
      isOwner: userRole === 'OWNER'
    };
  } catch (error) {
    console.error("Error checking board access:", error);
    return {
      hasAccess: false,
      error: 'Internal server error',
      status: 500,
      board: null,
      userRole: null
    };
  }
}

// Helper function to check if user can perform specific board actions
export async function canUserPerformBoardAction(
  userId: string,
  boardId: string,
  action: 'view' | 'edit' | 'delete' | 'create_card' | 'edit_card' | 'delete_card'
): Promise<{ canPerform: boolean; userRole: string | null; error?: string }> {
  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { workspaceId: true }
    });

    if (!board) {
      return { canPerform: false, userRole: null, error: 'Board not found' };
    }

    const userRole = await getUserWorkspaceRole(userId, board.workspaceId);
    
    if (!userRole) {
      return { canPerform: false, userRole: null, error: 'Not a workspace member' };
    }

    let permission: Permission;
    
    switch (action) {
      case 'view':
        permission = 'VIEW_BOARD';
        break;
      case 'edit':
        permission = 'EDIT_BOARD';
        break;
      case 'delete':
        permission = 'DELETE_BOARD';
        break;
      case 'create_card':
        permission = 'CREATE_CARD';
        break;
      case 'edit_card':
        permission = 'EDIT_ANY_CARD'; // Use ANY_CARD for general permission check
        break;
      case 'delete_card':
        permission = 'DELETE_ANY_CARD'; // Use ANY_CARD for general permission check
        break;
      default:
        return { canPerform: false, userRole, error: 'Invalid action' };
    }

    const canPerform = await hasPermission(userId, board.workspaceId, permission);
    
    return {
      canPerform,
      userRole,
      error: canPerform ? undefined : `Insufficient permissions for ${action}`
    };
  } catch (error) {
    console.error("Error checking board action permission:", error);
    return { canPerform: false, userRole: null, error: 'Internal server error' };
  }
}

// Enhanced function to get user permissions for a board
export async function getUserBoardPermissions(userId: string, boardId: string) {
  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { workspaceId: true }
    });

    if (!board) {
      return null;
    }

    const userRole = await getUserWorkspaceRole(userId, board.workspaceId);
    
    if (!userRole) {
      return null;
    }

    // Check all relevant permissions
    const permissions = {
      canView: await hasPermission(userId, board.workspaceId, 'VIEW_BOARD'),
      canEdit: await hasPermission(userId, board.workspaceId, 'EDIT_BOARD'),
      canDelete: await hasPermission(userId, board.workspaceId, 'DELETE_BOARD'),
      canCreateCards: await hasPermission(userId, board.workspaceId, 'CREATE_CARD'),
      canEditAnyCard: await hasPermission(userId, board.workspaceId, 'EDIT_ANY_CARD'),
      canEditOwnCard: await hasPermission(userId, board.workspaceId, 'EDIT_OWN_CARD'),
      canDeleteAnyCard: await hasPermission(userId, board.workspaceId, 'DELETE_ANY_CARD'),
      canDeleteOwnCard: await hasPermission(userId, board.workspaceId, 'DELETE_OWN_CARD'),
      canAssignCards: await hasPermission(userId, board.workspaceId, 'ASSIGN_CARD'),
    };

    return {
      userRole,
      permissions,
      isOwner: userRole === 'OWNER',
      isAdmin: userRole === 'ADMIN',
      isMember: userRole === 'MEMBER'
    };
  } catch (error) {
    console.error("Error getting user board permissions:", error);
    return null;
  }
}