// api/workspaces/[workspaceId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";

// Validation schema for workspace update
const workspaceUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name cannot exceed 50 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
});

// GET a single workspace by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { workspaceId } = params;
    
    // Find the workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the owner
    const isOwner = workspace.userId === session.user.id;
    
    // If not owner, check if user is a member
    if (!isOwner) {
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          userId: session.user.id,
          workspaceId: workspaceId,
        },
      });
      
      if (!membership) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }
    
    // Return the workspace with the user's role
    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        isOwner: isOwner,
      },
    }, { status: 200 });
    
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace' },
      { status: 500 }
    );
  }
}

// PATCH — Update workspace details
export async function PATCH(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { workspaceId } = params;
    
    // Find the workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }
    
    // Check if user is owner or admin
    const isOwner = workspace.userId === session.user.id;
    
    if (!isOwner) {
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          userId: session.user.id,
          workspaceId: workspaceId,
          role: "ADMIN", // Only admins can update workspace details
        },
      });
      
      if (!membership) {
        return NextResponse.json(
          { error: 'Forbidden: Only workspace owners and admins can update workspace details' },
          { status: 403 }
        );
      }
    }
    
    // Parse and validate the request body
    const body = await req.json();
    
    try {
      const validatedData = workspaceUpdateSchema.parse(body);
      
      // Update the workspace
      const updatedWorkspace = await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          name: validatedData.name,
        },
      });
      
      return NextResponse.json({
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        isOwner: isOwner,
      }, { status: 200 });
      
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }
    
  } catch (error) {
    console.error("Error updating workspace:", error);
    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500 }
    );
  }
}

// DELETE — Remove a workspace
export async function DELETE(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { workspaceId } = params;
    
    // Find the workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }
    
    // Only workspace owner can delete the workspace
    if (workspace.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Only workspace owner can delete the workspace' },
        { status: 403 }
      );
    }
    
    // Delete all workspace members
    await prisma.workspaceMember.deleteMany({
      where: { workspaceId }
    });
    
    // Delete all workspace invitations
    await prisma.invitation.deleteMany({
      where: { workspaceId }
    });
    
    // Delete the workspace
    await prisma.workspace.delete({
      where: { id: workspaceId }
    });
    
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}