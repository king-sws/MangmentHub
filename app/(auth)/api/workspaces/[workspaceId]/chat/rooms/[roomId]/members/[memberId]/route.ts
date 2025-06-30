/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/workspaces/[workspaceId]/chat/rooms/[roomId]/members/[memberId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// PATCH - Update member status (make admin/remove admin)
export async function PATCH(
  req: Request,
  { params }: { params: { workspaceId: string; roomId: string; memberId: string } }
) {
  const { workspaceId, roomId, memberId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { isAdmin } = await req.json();
 
  try {
    // Check if the chat room exists
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId }
    });
    
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 });
    }

    // Check if the current user is an admin
    const currentMember = await prisma.chatRoomMember.findUnique({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId: session.user.id
        }
      }
    });
    
    if (!currentMember?.isAdmin) {
      return NextResponse.json({ 
        error: "Must be room admin", 
        message: "You must be a room admin to manage member permissions" 
      }, { status: 403 });
    }

    // Get the target member
    const member = await prisma.chatRoomMember.findUnique({
      where: {
        id: memberId
      }
    });
    
    if (!member || member.chatRoomId !== roomId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Update the member
    const updatedMember = await prisma.chatRoomMember.update({
      where: { id: memberId },
      data: { isAdmin },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });
    
    // Create a system message about the role change
    const action = isAdmin ? "is now an admin" : "is no longer an admin";
    await prisma.chatMessage.create({
      data: {
        chatRoomId: roomId,
        userId: session.user.id,
        content: `${updatedMember.user.name || "A member"} ${action}`,
        isSystemMessage: true
      }
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating chat room member:", error);
    return NextResponse.json(
      { 
        error: "Failed to update chat room member",
        message: "Something went wrong updating the member status"
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove a member from the chat room
export async function DELETE(
  req: Request,
  { params }: { params: { workspaceId: string; roomId: string; memberId: string } }
) {
  const { workspaceId, roomId, memberId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
 
  try {
    // Find the target member
    const member = await prisma.chatRoomMember.findUnique({
      where: { id: memberId },
      include: {
        user: true
      }
    });
    
    if (!member || member.chatRoomId !== roomId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Check permissions:
    // 1. Users can remove themselves
    // 2. Room admins can remove non-admins
    const currentMember = await prisma.chatRoomMember.findUnique({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId: session.user.id
        }
      }
    });
    
    const isSelf = member.userId === session.user.id;
    const isAdminRemovingNonAdmin = currentMember?.isAdmin && !member.isAdmin;
    const isAdminRemovingAdmin = currentMember?.isAdmin && member.isAdmin && session.user.id !== member.userId;
    
    if (!isSelf && !isAdminRemovingNonAdmin && !isAdminRemovingAdmin) {
      return NextResponse.json({
        error: "Insufficient permissions",
        message: "You don't have permission to remove this member"
      }, { status: 403 });
    }

    // Get user name before deletion for the system message
    const memberName = member.user?.name || "A member";

    // Remove the member
    await prisma.chatRoomMember.delete({
      where: { id: memberId }
    });
    
    // Create a system message about the member removal
    await prisma.chatMessage.create({
      data: {
        chatRoomId: roomId,
        userId: session.user.id,
        content: isSelf 
          ? `${memberName} left the room` 
          : `${memberName} was removed from the room`,
        isSystemMessage: true
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing chat room member:", error);
    return NextResponse.json(
      { 
        error: "Failed to remove chat room member",
        message: "Something went wrong removing the member"
      },
      { status: 500 }
    );
  }
}