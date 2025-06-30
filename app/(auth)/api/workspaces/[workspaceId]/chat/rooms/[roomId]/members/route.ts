// app/api/workspaces/[workspaceId]/chat/rooms/[roomId]/members/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * GET - List all members of a chat room
 */
export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string; roomId: string } }
) {
  const { workspaceId, roomId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check workspace and room access
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });
    
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check if the chat room exists and belongs to the workspace
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { 
        id: roomId,
        workspaceId: workspaceId
      }
    });
    
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 });
    }

    // Verify user access to workspace
    const hasWorkspaceAccess = workspace.userId === session.user.id || await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id
      }
    });
    
    if (!hasWorkspaceAccess) {
      return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
    }

    // For private rooms, ensure user is a member
    if (chatRoom.isPrivate) {
      const isMember = await prisma.chatRoomMember.findUnique({
        where: {
          chatRoomId_userId: {
            chatRoomId: roomId,
            userId: session.user.id
          }
        }
      });
      
      if (!isMember) {
        return NextResponse.json({ error: "Access denied to private room" }, { status: 403 });
      }
    }

    // Get room members with detailed user info
    const members = await prisma.chatRoomMember.findMany({
      where: { chatRoomId: roomId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { isAdmin: 'desc' }, // Admins first
        { joinedAt: 'asc' }  // Then by join date
      ]
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching chat room members:", error);
    return NextResponse.json(
      { error: "Failed to fetch room members", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST - Add a member to the chat room
 */
export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string; roomId: string } }
) {
  const { workspaceId, roomId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { userId, isAdmin = false } = await req.json();
  
  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // Check if the target user exists and is a workspace member
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const workspaceMembership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId
      }
    });
    
    if (!workspaceMembership) {
      return NextResponse.json({ error: "User is not a member of this workspace" }, { status: 403 });
    }

    // Check if the chat room exists and belongs to the workspace
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { 
        id: roomId,
        workspaceId: workspaceId
      }
    });
    
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 });
    }

    // Check if current user has admin rights in the room
    const currentUserAdmin = await prisma.chatRoomMember.findFirst({
      where: {
        chatRoomId: roomId,
        userId: session.user.id,
        isAdmin: true
      }
    });
    
    // Also check if user is workspace owner (they can always add)
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });
    
    const isWorkspaceOwner = workspace?.userId === session.user.id;
    
    if (!currentUserAdmin && !isWorkspaceOwner) {
      return NextResponse.json({ error: "Only admins can add members" }, { status: 403 });
    }

    // Check if user is already a member
    const existingMembership = await prisma.chatRoomMember.findUnique({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId
        }
      }
    });
    
    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this room" },
        { status: 400 }
      );
    }

    // Add the user to the room
    const newMember = await prisma.chatRoomMember.create({
      data: {
        chatRoomId: roomId,
        userId,
        isAdmin,
        lastReadAt: new Date() // Initialize last read time to now
      },
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

    // Create a system message to notify about new member
    await prisma.chatMessage.create({
      data: {
        chatRoomId: roomId,
        content: `${targetUser.name || targetUser.email} has joined the room`,
        userId: session.user.id,
        isSystemMessage: true
      }
    });

    // Emit real-time event for new member
    try {
      const socketPayload = {
        event: "memberAdded",
        roomId: roomId,
        member: newMember
      };
      
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/socket/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(socketPayload),
      });
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
      // We don't want to fail the API call if socket emission fails
    }

    return NextResponse.json(newMember);
  } catch (error) {
    console.error("Error adding member to chat room:", error);
    return NextResponse.json(
      { error: "Failed to add member", details: (error as Error).message },
      { status: 500 }
    );
  }
}