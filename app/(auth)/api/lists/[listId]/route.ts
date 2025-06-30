
// api/lists/[listId]/route.ts - FIXED with proper permissions
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { z } from "zod";
import { requirePermission, getUserWorkspaceRole } from "@/lib/permission";

const listUpdateSchema = z.object({
  title: z.string().min(1),
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
    const validatedData = listUpdateSchema.safeParse(body);
   
    if (!validatedData.success) {
      return new NextResponse(
        JSON.stringify({ error: validatedData.error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // FIXED: Get list with workspace info for permission check
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        board: {
          include: {
            workspace: true
          }
        }
      }
    });

    if (!list) {
      return new NextResponse("List not found", { status: 404 });
    }

    const workspaceId = list.board.workspaceId;

    // FIXED: Use proper permission system
    const permissionCheck = await requirePermission(userId, workspaceId, 'EDIT_LIST');
    
    if (!permissionCheck.success) {
      return new NextResponse(
        permissionCheck.error || "Cannot edit lists in this workspace", 
        { status: permissionCheck.status || 403 }
      );
    }

    const updatedList = await prisma.list.update({
      where: { id: listId },
      data: validatedData.data,
    });

    console.log(`[LIST_PATCH] List "${updatedList.title}" updated by user ${userId} (role: ${await getUserWorkspaceRole(userId, workspaceId)})`);

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error("[LIST_PATCH]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(
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

    // FIXED: Get list with workspace info for permission check
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        board: {
          include: {
            workspace: true
          }
        }
      }
    });

    if (!list) {
      return new NextResponse("List not found", { status: 404 });
    }

    const workspaceId = list.board.workspaceId;

    // FIXED: Use proper permission system - DELETE_LIST requires ADMIN role
    const permissionCheck = await requirePermission(userId, workspaceId, 'DELETE_LIST');
    
    if (!permissionCheck.success) {
      return new NextResponse(
        permissionCheck.error || "Cannot delete lists in this workspace", 
        { status: permissionCheck.status || 403 }
      );
    }

    // Use a transaction to ensure atomicity
    await prisma.$transaction([
      prisma.card.deleteMany({
        where: { listId },
      }),
      prisma.list.delete({
        where: { id: listId },
      })
    ]);

    console.log(`[LIST_DELETE] List "${list.title}" deleted by user ${userId} (role: ${await getUserWorkspaceRole(userId, workspaceId)})`);

    return NextResponse.json({ 
      message: "List and all associated cards deleted successfully" 
    }, { status: 200 });
  } catch (error) {
    console.error("[LIST_DELETE]", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}