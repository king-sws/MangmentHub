// app/api/debug/workspace-diagnostics/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Comprehensive diagnostics endpoint for workspace-related issues
 */
export async function GET(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const url = new URL(req.url);
    const workspaceId = url.searchParams.get("workspaceId");
    
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }
    
    // Verbose logging
    console.log('[DIAGNOSTICS] Session user:', session.user.id);
    console.log('[DIAGNOSTICS] Workspace ID to check:', workspaceId);
    
    // Check if ID format is valid (assuming UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(workspaceId);
    
    if (!isValidUUID) {
      console.log('[DIAGNOSTICS] Invalid workspace ID format');
      return NextResponse.json({ 
        error: "Invalid workspace ID format", 
        expected: "UUID format",
        received: workspaceId
      }, { status: 400 });
    }
    
    // First attempt direct workspace query
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });
    
    console.log('[DIAGNOSTICS] Direct workspace query result:', workspace);
    
    // Check all workspaces for this user
    const userWorkspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        userId: true
      }
    });
    
    console.log('[DIAGNOSTICS] User workspaces:', userWorkspaces);
    
    // Check all workspace memberships for this user
    const userMemberships = await prisma.workspaceMember.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        workspaceId: true,
        role: true
      }
    });
    
    console.log('[DIAGNOSTICS] User memberships:', userMemberships);
    
    // Count total workspaces in the system
    const totalWorkspaces = await prisma.workspace.count();
    
    // Check if the exact ID exists in any workspace
    const exactMatch = userWorkspaces.find(w => w.id === workspaceId);
    const membershipMatch = userMemberships.find(m => m.workspaceId === workspaceId);
    
    // Check if the ID might be in a different case (UUID should be case-insensitive)
    const caseInsensitiveMatch = userWorkspaces.find(
      w => w.id.toLowerCase() === workspaceId.toLowerCase() && w.id !== workspaceId
    );
    
    return NextResponse.json({
      diagnostics: {
        requestedId: workspaceId,
        isValidUUID: isValidUUID,
        workspaceExists: !!workspace,
        exactMatchInUserWorkspaces: !!exactMatch,
        membershipExists: !!membershipMatch,
        possibleCaseIssue: !!caseInsensitiveMatch,
        totalSystemWorkspaces: totalWorkspaces,
        userWorkspaceCount: userWorkspaces.length,
        membershipCount: userMemberships.length
      },
      workspace: workspace,
      userWorkspaces: userWorkspaces,
      userMemberships: userMemberships,
      recommendations: !workspace ? [
        "Verify the workspace ID is correct",
        "Check if the workspace was deleted",
        "Ensure the user has permissions to access this workspace",
        "Confirm the database connection is working properly"
      ] : []
    });
    
  } catch (error) {
    console.error("Error in workspace diagnostics:", error);
    return NextResponse.json({
      error: "Diagnostics failed",
      details: (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}