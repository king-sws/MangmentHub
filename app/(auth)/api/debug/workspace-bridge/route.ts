// app/api/debug/workspace-sync/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * This endpoint helps synchronize mismatched workspace references by copying the 
 * membership information from one workspace to another
 */
export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { dashboardId, workspaceId } = await req.json();
    
    // Validate inputs
    if (!dashboardId || !workspaceId) {
      return NextResponse.json({ 
        error: "Both dashboardId and workspaceId are required" 
      }, { status: 400 });
    }
    
    console.log(`[DEBUG] Workspace sync request: dashboard=${dashboardId}, workspace=${workspaceId}`);
    
    // Check if both workspaces exist
    const dashboardWorkspace = await prisma.workspace.findUnique({
      where: { id: dashboardId }
    });
    
    const actualWorkspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });
    
    if (!dashboardWorkspace) {
      return NextResponse.json({ 
        error: "Dashboard workspace not found" 
      }, { status: 404 });
    }
    
    if (!actualWorkspace) {
      return NextResponse.json({ 
        error: "Target workspace not found" 
      }, { status: 404 });
    }
    
    // Check if they belong to the same user
    if (dashboardWorkspace.userId !== actualWorkspace.userId) {
      return NextResponse.json({ 
        error: "Workspaces must belong to the same owner for synchronization" 
      }, { status: 403 });
    }
    
    // Check if the current user has access to both workspaces
    const dashboardMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: dashboardId,
        userId: session.user.id
      }
    });
    
    const actualMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: session.user.id
      }
    });
    
    const hasDashboardAccess = dashboardWorkspace.userId === session.user.id || !!dashboardMembership;
    const hasWorkspaceAccess = actualWorkspace.userId === session.user.id || !!actualMembership;
    
    if (!hasDashboardAccess) {
      return NextResponse.json({ 
        error: "You don't have access to the dashboard workspace" 
      }, { status: 403 });
    }
    
    // Fix chat room data if needed
    const chatRooms = await prisma.chatRoom.findMany({
      where: { workspaceId: dashboardId }
    });
    
    // Track all the operations we'll perform
    const operations = {
      membershipCreated: false,
      chatRoomsUpdated: 0,
      boardsUpdated: 0
    };
    
    // If user has access to dashboard but not workspace, create the membership
    if (hasDashboardAccess && !hasWorkspaceAccess) {
      await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: session.user.id,
          role: dashboardMembership?.role || "MEMBER"
        }
      });
      operations.membershipCreated = true;
    }
    
    // Get any chat rooms that need to be updated
    if (chatRooms.length > 0) {
      // Update the chat rooms to use the correct workspace ID
      await prisma.chatRoom.updateMany({
        where: { workspaceId: dashboardId },
        data: { workspaceId }
      });
      
      operations.chatRoomsUpdated = chatRooms.length;
    }
    
    // Fix board data if needed
    const boards = await prisma.board.findMany({
      where: { workspaceId: dashboardId }
    });
    
    if (boards.length > 0) {
      // Update the boards to use the correct workspace ID
      await prisma.board.updateMany({
        where: { workspaceId: dashboardId },
        data: { workspaceId }
      });
      
      operations.boardsUpdated = boards.length;
    }
    
    return NextResponse.json({
      success: true,
      message: "Workspace synchronization completed",
      operations,
      dashboard: {
        id: dashboardWorkspace.id,
        name: dashboardWorkspace.name
      },
      workspace: {
        id: actualWorkspace.id,
        name: actualWorkspace.name
      }
    });
    
  } catch (error) {
    console.error("Error synchronizing workspaces:", error);
    return NextResponse.json(
      { error: "Failed to synchronize workspaces", details: (error as Error).message },
      { status: 500 }
    );
  }
}