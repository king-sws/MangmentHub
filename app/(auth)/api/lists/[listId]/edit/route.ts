/* eslint-disable @typescript-eslint/no-explicit-any */
// api/lists/[listId]/edit/route.ts - Enhanced List Edit with Permission System
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { requirePermission, getUserWorkspaceRole } from "@/lib/permission";

const listEditSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  color: z.string().optional(), // For list color/theme
  limit: z.number().nullable().optional(), // WIP limit for the list
  position: z.number().optional(), // For reordering
});

export async function PATCH(
  req: Request,
  { params }: { params: { listId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { listId } = params;
    const userId = session.user.id;
   
    if (!listId) {
      return new NextResponse("Missing listId", { status: 400 });
    }

    // Get and validate the request body
    const body = await req.json();
    const validatedData = listEditSchema.safeParse(body);
   
    if (!validatedData.success) {
      return new NextResponse(
        JSON.stringify({ error: validatedData.error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get list with workspace info for permission check
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        board: {
          include: {
            workspace: true
          }
        },
        _count: {
          select: {
            cards: true
          }
        }
      }
    });

    if (!list) {
      return new NextResponse("List not found", { status: 404 });
    }

    const workspaceId = list.board.workspaceId;

    // Check permissions - use EDIT_LIST permission
    const permissionCheck = await requirePermission(userId, workspaceId, 'EDIT_LIST');
    
    if (!permissionCheck.success) {
      return new NextResponse(
        permissionCheck.error || "Cannot edit lists in this workspace", 
        { status: permissionCheck.status || 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (validatedData.data.title !== undefined) {
      updateData.title = validatedData.data.title;
    }
    
    if (validatedData.data.description !== undefined) {
      updateData.description = validatedData.data.description;
    }
    
    if (validatedData.data.color !== undefined) {
      updateData.color = validatedData.data.color;
    }
    
    if (validatedData.data.limit !== undefined) {
      updateData.limit = validatedData.data.limit;
    }
    
    if (validatedData.data.position !== undefined) {
      updateData.order = validatedData.data.position;
    }

    // Update the list
    const updatedList = await prisma.list.update({
      where: { id: listId },
      data: updateData,
      include: {
        _count: {
          select: {
            cards: true
          }
        }
      }
    });

    console.log(`[LIST_EDIT] List "${updatedList.title}" updated by user ${userId} (role: ${await getUserWorkspaceRole(userId, workspaceId)})`);

    return NextResponse.json({
      success: true,
      message: "List updated successfully",
      list: updatedList
    });

  } catch (error) {
    console.error("[LIST_EDIT]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Get list details for editing
export async function GET(
  req: Request,
  { params }: { params: { listId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { listId } = params;
    const userId = session.user.id;

    if (!listId) {
      return new NextResponse("Missing listId", { status: 400 });
    }

    // Get list with workspace info for permission check
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        board: {
          include: {
            workspace: true
          }
        },
        _count: {
          select: {
            cards: true
          }
        }
      }
    });

    if (!list) {
      return new NextResponse("List not found", { status: 404 });
    }

    const workspaceId = list.board.workspaceId;

    // Check permissions - use VIEW_BOARD permission
    const permissionCheck = await requirePermission(userId, workspaceId, 'VIEW_BOARD');
    
    if (!permissionCheck.success) {
      return new NextResponse(
        permissionCheck.error || "Cannot view this board", 
        { status: permissionCheck.status || 403 }
      );
    }

    console.log(`[LIST_EDIT_GET] List "${list.title}" details fetched by user ${userId} (role: ${await getUserWorkspaceRole(userId, workspaceId)})`);

    return NextResponse.json({
      list,
      userRole: await getUserWorkspaceRole(userId, workspaceId)
    });

  } catch (error) {
    console.error("[LIST_EDIT_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}