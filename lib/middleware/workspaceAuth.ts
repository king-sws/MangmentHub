/* eslint-disable @typescript-eslint/no-explicit-any */
// middleware/workspaceAuth.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Session } from "next-auth";

/**
 * Verify if the current user has access to the specified workspace
 * This function can be used in API routes to ensure proper workspace access
 */
export async function verifyWorkspaceAccess(
  workspaceId: string, 
  session: Session | null
): Promise<{ 
  hasAccess: boolean; 
  workspace?: any; 
  role?: string;
  error?: string;
}> {
  // No session means no access
  if (!session?.user?.id) {
    return { hasAccess: false, error: "Unauthorized: No valid session" };
  }

  try {
    // First, check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) {
      return { hasAccess: false, error: "Workspace not found" };
    }

    // If user is the owner, they have access
    if (workspace.userId === session.user.id) {
      return { 
        hasAccess: true, 
        workspace, 
        role: "OWNER" 
      };
    }

    // Otherwise, check membership
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id
      }
    });

    if (!membership) {
      return { hasAccess: false, error: "Not a workspace member" };
    }

    // Return success with role information
    return { 
      hasAccess: true, 
      workspace, 
      role: membership.role 
    };
  } catch (error) {
    console.error("Workspace access verification error:", error);
    return { 
      hasAccess: false, 
      error: `Error verifying access: ${(error as Error).message}` 
    };
  }
}

/**
 * Create a handler function for workspace API routes that verifies access
 * before allowing the request to proceed
 */
export function createWorkspaceHandler(
  handler: (req: Request, params: { 
    workspaceId: string, 
    workspace: any, 
    session: Session, 
    role: string 
  }) => Promise<Response>
) {
  return async (req: Request, { params }: { params: { workspaceId: string } }) => {
    // Get workspaceId from route params
    const { workspaceId } = params;
    
    // Get the session
    const authResult = await import("@/auth");
    const session = await authResult.auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify workspace access
    const { hasAccess, workspace, role, error } = await verifyWorkspaceAccess(
      workspaceId,
      session
    );

    if (!hasAccess) {
      console.error(`[Access Denied] User ${session.user.id} accessing workspace ${workspaceId}: ${error}`);
      return NextResponse.json({ error: error || "Access denied" }, { status: 403 });
    }

    // Allow the original handler to process the request
    return handler(req, { workspaceId, workspace, session, role: role || "MEMBER" });
  };
}

/**
 * Creates a handler for chat room API endpoints that verifies both workspace
 * and chat room access
 */
export function createChatRoomHandler(
  handler: (req: Request, params: { 
    workspaceId: string, 
    roomId: string,
    workspace: any,
    chatRoom: any,
    session: Session, 
    role: string 
  }) => Promise<Response>
) {
  return async (
    req: Request,
    { params }: { params: { workspaceId: string; roomId: string } }
  ) => {
    // Get IDs from route params
    const { workspaceId, roomId } = params;
    
    // Get the session
    const authResult = await import("@/auth");
    const session = await authResult.auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First verify workspace access
    const { hasAccess, workspace, role, error } = await verifyWorkspaceAccess(
      workspaceId,
      session
    );

    if (!hasAccess) {
      return NextResponse.json({ error: error || "Access denied" }, { status: 403 });
    }

    // Then check chat room access
    try {
      const chatRoom = await prisma.chatRoom.findFirst({
        where: { 
          id: roomId,
          workspaceId
        }
      });

      if (!chatRoom) {
        return NextResponse.json({ error: "Chat room not found" }, { status: 404 });
      }

      // Call the original handler with all necessary context
      return handler(req, { 
        workspaceId, 
        roomId, 
        workspace, 
        chatRoom,
        session, 
        role: role || "MEMBER" 
      });
    } catch (error) {
      console.error("Chat room access verification error:", error);
      return NextResponse.json(
        { error: `Error verifying room access: ${(error as Error).message}` },
        { status: 500 }
      );
    }
  };
}