// api/workspaces/[workspaceId]/role/route.ts - Fixed with debugging
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserWorkspaceRole, hasPermission } from "@/lib/permission";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const workspaceId = params.workspaceId;

    // Debug: Log the request
    console.log(`[WORKSPACE_ROLE] Checking role for user ${userId} in workspace ${workspaceId}`);

    // First, verify the workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { 
        id: true, 
        name: true, 
        userId: true,
        members: {
          where: { userId },
          select: { role: true, userId: true }
        }
      }
    });

    if (!workspace) {
      console.log(`[WORKSPACE_ROLE] Workspace ${workspaceId} not found`);
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Debug: Log workspace info
    console.log(`[WORKSPACE_ROLE] Workspace found:`, {
      id: workspace.id,
      name: workspace.name,
      ownerId: workspace.userId,
      members: workspace.members
    });

    // Get the user's role
    const role = await getUserWorkspaceRole(userId, workspaceId);
    
    console.log(`[WORKSPACE_ROLE] User role: ${role}`);

    if (!role) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Check all permissions
    const permissions = {
      // Workspace permissions
      canManageWorkspace: await hasPermission(userId, workspaceId, 'MANAGE_WORKSPACE'),
      canEditWorkspace: await hasPermission(userId, workspaceId, 'EDIT_WORKSPACE'),
      canDeleteWorkspace: await hasPermission(userId, workspaceId, 'DELETE_WORKSPACE'),
      
      // Member permissions
      canInviteMembers: await hasPermission(userId, workspaceId, 'INVITE_MEMBERS'),
      canRemoveMembers: await hasPermission(userId, workspaceId, 'REMOVE_MEMBERS'),
      canChangeRoles: await hasPermission(userId, workspaceId, 'CHANGE_ROLES'),
      canViewMembers: await hasPermission(userId, workspaceId, 'VIEW_MEMBERS'),
      
      // Board permissions
      canCreateBoards: await hasPermission(userId, workspaceId, 'CREATE_BOARD'),
      canEditBoards: await hasPermission(userId, workspaceId, 'EDIT_BOARD'),
      canDeleteBoards: await hasPermission(userId, workspaceId, 'DELETE_BOARD'),
      canViewBoards: await hasPermission(userId, workspaceId, 'VIEW_BOARD'),
      
      // Card permissions
      canCreateCards: await hasPermission(userId, workspaceId, 'CREATE_CARD'),
      canEditAnyCard: await hasPermission(userId, workspaceId, 'EDIT_ANY_CARD'),
      canEditOwnCard: await hasPermission(userId, workspaceId, 'EDIT_OWN_CARD'),
      canDeleteAnyCard: await hasPermission(userId, workspaceId, 'DELETE_ANY_CARD'),
      canDeleteOwnCard: await hasPermission(userId, workspaceId, 'DELETE_OWN_CARD'),
      canAssignCards: await hasPermission(userId, workspaceId, 'ASSIGN_CARD'),
      
      // Chat permissions
      canSendMessages: await hasPermission(userId, workspaceId, 'SEND_MESSAGE'),
      canDeleteAnyMessage: await hasPermission(userId, workspaceId, 'DELETE_ANY_MESSAGE'),
      canDeleteOwnMessage: await hasPermission(userId, workspaceId, 'DELETE_OWN_MESSAGE'),
    };

    console.log(`[WORKSPACE_ROLE] Permissions calculated:`, permissions);

    return NextResponse.json({
      role,
      permissions,
      debug: {
        userId,
        workspaceId,
        workspaceOwnerId: workspace.userId,
        isOwner: workspace.userId === userId,
        memberRecord: workspace.members[0] || null
      }
    });
  } catch (error) {
    console.error("[WORKSPACE_ROLE] Error fetching workspace role:", error);
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 }
    );
  }
}