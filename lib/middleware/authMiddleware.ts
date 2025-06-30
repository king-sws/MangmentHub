// lib/middleware/authMiddleware.ts - Comprehensive Auth Middleware
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserWorkspaceRole, hasPermission, Permission } from "@/lib/permission";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
  workspaceRole?: string;
}

/**
 * Middleware to check if user is authenticated
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function requireAuth(req: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return {
      success: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    };
  }
  
  return {
    success: true,
    user: session.user
  };
}

/**
 * Middleware to check workspace membership
 */
export async function requireWorkspaceMember(userId: string, workspaceId: string) {
  const role = await getUserWorkspaceRole(userId, workspaceId);
  
  if (!role) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Not a workspace member" }, 
        { status: 403 }
      )
    };
  }
  
  return {
    success: true,
    role
  };
}

/**
 * Middleware to check specific workspace permission
 */
export async function requireWorkspacePermission(
  userId: string, 
  workspaceId: string, 
  permission: Permission
) {
  const hasAccess = await hasPermission(userId, workspaceId, permission);
  
  if (!hasAccess) {
    const role = await getUserWorkspaceRole(userId, workspaceId);
    return {
      success: false,
      response: NextResponse.json(
        { 
          error: role 
            ? `Insufficient permissions. Required: ${permission}, Your role: ${role}` 
            : "Not a workspace member" 
        }, 
        { status: role ? 403 : 404 }
      )
    };
  }
  
  return {
    success: true,
    role: await getUserWorkspaceRole(userId, workspaceId)
  };
}

/**
 * Combined middleware for API routes that need workspace permissions
 */
export async function withWorkspacePermission(
  req: NextRequest,
  workspaceId: string,
  permission: Permission
) {
  // Check authentication
  const authCheck = await requireAuth(req);
  if (!authCheck.success) {
    return authCheck;
  }
  
  // Check workspace permission
  const permissionCheck = await requireWorkspacePermission(
    authCheck.user?.id as string, 
    workspaceId, 
    permission
  );
  
  if (!permissionCheck.success) {
    return permissionCheck;
  }
  
  return {
    success: true,
    user: authCheck.user,
    role: permissionCheck.role
  };
}