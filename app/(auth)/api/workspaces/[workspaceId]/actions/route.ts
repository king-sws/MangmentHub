// api/workspaces/[workspaceId]/actions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { hasPermission, isMember } from "@/lib/permission";

/**
 * Route for actions that all workspace members can perform
 */
export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const { workspaceId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { action, data } = await req.json();

  try {
    // Check if user is a member of the workspace
    const isMemberOfWorkspace = await isMember(session.user.id, workspaceId);
    
    if (!isMemberOfWorkspace) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle different actions that members can perform
    switch (action) {
      case "create_content": {
        // Check if user has permission to create content
        const canCreateContent = await hasPermission(session.user.id, workspaceId, "CREATE_CONTENT");
        
        if (!canCreateContent) {
          return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }
        
        // Example: Create a task or note
        const { title, description, type } = data;
        
        // This is just an example - adjust based on your actual schema
        const content = await prisma.content.create({
          data: {
            title,
            description,
            type,
            workspaceId,
            createdById: session.user.id
          }
        });
        
        return NextResponse.json({ success: true, content });
      }
      
      case "update_own_content": {
        const { contentId, updates } = data;
        
        // Check if content exists and belongs to the user
        const content = await prisma.content.findUnique({
          where: { id: contentId }
        });
        
        if (!content) {
          return NextResponse.json({ error: "Content not found" }, { status: 404 });
        }
        
        // Only allow updates if user is the creator or has admin/owner role
        if (content.createdById !== session.user.id) {
          const canEditAny = await hasPermission(session.user.id, workspaceId, "EDIT_ANY_CONTENT");
          
          if (!canEditAny) {
            return NextResponse.json({ error: "Can only edit your own content" }, { status: 403 });
          }
        }
        
        // Update the content
        const updatedContent = await prisma.content.update({
          where: { id: contentId },
          data: updates
        });
        
        return NextResponse.json({ success: true, content: updatedContent });
      }
      
      case "leave_workspace": {
        // Allow members to leave the workspace
        const member = await prisma.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: session.user.id,
              workspaceId
            }
          }
        });
        
        if (!member) {
          return NextResponse.json({ error: "Not a member" }, { status: 400 });
        }
        
        // Owners can't leave unless there's another owner
        if (member.role === "OWNER") {
          // Check if there are other owners
          const otherOwners = await prisma.workspaceMember.count({
            where: {
              workspaceId,
              role: "OWNER",
              userId: { not: session.user.id }
            }
          });
          
          if (otherOwners === 0) {
            return NextResponse.json(
              { error: "You must transfer ownership before leaving" },
              { status: 400 }
            );
          }
        }
        
        // Remove the member
        await prisma.workspaceMember.delete({
          where: {
            userId_workspaceId: {
              userId: session.user.id,
              workspaceId
            }
          }
        });
        
        return NextResponse.json({ success: true });
      }
      
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Action error:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}