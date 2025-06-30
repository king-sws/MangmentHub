/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/workspaces/[workspaceId]/chat/rooms/[roomId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET - Get a specific chat room and its messages
export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string; roomId: string } }
) {
  const { workspaceId, roomId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const before = url.searchParams.get("before"); // Message ID for pagination
  
  try {
    // Check if user is a member of the chat room
    const roomMembership = await prisma.chatRoomMember.findUnique({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId: session.user.id
        }
      }
    });
    
    // If private room, ensure user is a member
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        members: {
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
        }
      }
    });
    
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 });
    }
    
    if (chatRoom.isPrivate && !roomMembership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update last read timestamp for this user
    if (roomMembership) {
      await prisma.chatRoomMember.update({
        where: {
          id: roomMembership.id
        },
        data: {
          lastReadAt: new Date()
        }
      });
    }

    // Fetch messages with pagination
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageFilter: any = {
      chatRoomId: roomId
    };

    if (before) {
      const beforeMessage = await prisma.chatMessage.findUnique({
        where: { id: before }
      });
      if (beforeMessage) {
        messageFilter.createdAt = {
          lt: beforeMessage.createdAt
        };
      }
    }

    const messages = await prisma.chatMessage.findMany({
      where: messageFilter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        attachments: true,
        replyTo: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return NextResponse.json({
      chatRoom,
      messages,
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error("Error fetching chat room:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat room data" },
      { status: 500 }
    );
  }
}

// PATCH - Update a chat room
export async function PATCH(
  req: Request,
  { params }: { params: { workspaceId: string; roomId: string } }
) {
  const { workspaceId, roomId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { name, description, isPrivate } = await req.json();

  try {
    // Check if user is an admin of the chat room
    const isAdmin = await prisma.chatRoomMember.findFirst({
      where: {
        chatRoomId: roomId,
        userId: session.user.id,
        isAdmin: true
      }
    });
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Must be a room admin" }, { status: 403 });
    }

    // Update the chat room
    const updatedRoom = await prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isPrivate !== undefined && { isPrivate })
      }
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("Error updating chat room:", error);
    return NextResponse.json(
      { error: "Failed to update chat room" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a chat room
export async function DELETE(
  req: Request,
  { params }: { params: { workspaceId: string; roomId: string } }
) {
  const { workspaceId, roomId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if user is an admin of the chat room
    const isAdmin = await prisma.chatRoomMember.findFirst({
      where: {
        chatRoomId: roomId,
        userId: session.user.id,
        isAdmin: true
      }
    });
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Must be a room admin" }, { status: 403 });
    }

    // Delete the chat room (cascade will delete messages and members)
    await prisma.chatRoom.delete({
      where: { id: roomId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting chat room:", error);
    return NextResponse.json(
      { error: "Failed to delete chat room" },
      { status: 500 }
    );
  }
}