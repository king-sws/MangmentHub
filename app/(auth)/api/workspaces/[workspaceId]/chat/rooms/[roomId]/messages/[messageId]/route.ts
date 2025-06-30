// app/api/workspaces/[workspaceId]/chat/rooms/[roomId]/messages/[messageId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * GET - Fetch a specific message with all its details
 */
export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string; roomId: string; messageId: string } }
) {
  const { workspaceId, roomId, messageId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });
    
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Check if user has access to the workspace
    const hasWorkspaceAccess = workspace.userId === session.user.id || await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id
      }
    });
    
    if (!hasWorkspaceAccess) {
      return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
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

    // Check if user has access to the room if private
    if (chatRoom.isPrivate) {
      const roomMembership = await prisma.chatRoomMember.findUnique({
        where: {
          chatRoomId_userId: {
            chatRoomId: roomId,
            userId: session.user.id
          }
        }
      });
      
      if (!roomMembership) {
        return NextResponse.json({ error: "Access denied to private room" }, { status: 403 });
      }
    }

    // Fetch the message with all related info
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
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
      }
    });
    
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    
    if (message.chatRoomId !== roomId) {
      return NextResponse.json({ error: "Message not in this room" }, { status: 400 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { error: "Failed to fetch message", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Edit a message
 */
export async function PATCH(
  req: Request,
  { params }: { params: { workspaceId: string; roomId: string; messageId: string } }
) {
  const { workspaceId, roomId, messageId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { content } = await req.json();
  
  // Validate content
  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
  }

  try {
    // Check if the message exists and belongs to the user
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        chatRoom: {
          select: {
            workspaceId: true
          }
        }
      }
    });
    
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    
    if (message.chatRoomId !== roomId) {
      return NextResponse.json({ error: "Message not in this room" }, { status: 400 });
    }
    
    if (message.chatRoom.workspaceId !== workspaceId) {
      return NextResponse.json({ error: "Message not in this workspace" }, { status: 400 });
    }
    
    if (message.userId !== session.user.id) {
      return NextResponse.json({ error: "Can only edit your own messages" }, { status: 403 });
    }
    
    // Check if the message is too old to edit (e.g., 24 hours limit)
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const MAX_EDIT_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (messageAge > MAX_EDIT_AGE) {
      return NextResponse.json({ error: "Cannot edit messages older than 24 hours" }, { status: 403 });
    }

    // Update the message
    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        updatedAt: new Date()
      },
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
      }
    });
    // Emit real-time event for message update
    try {
      const socketPayload = {
        event: "newMessage",
        roomId: `${workspaceId}:${roomId}`, // Using the actual roomId
        message: message
      };
      
      // Add this debug line to verify the payload
      console.log("Emitting socket payload:", socketPayload);
      
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/socket/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(socketPayload),
      });
      
      // Also emit with the combined format for compatibility
      const combinedSocketPayload = {
        event: "newMessage",
        roomId: `${workspaceId}:${roomId}`,
        message: message
      };
      
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/socket/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(combinedSocketPayload),
      });
      
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
      // We don't want to fail the API call if socket emission fails
    }

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Error editing message:", error);
    return NextResponse.json(
      { error: "Failed to edit message", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a message
 */
export async function DELETE(
  req: Request,
  { params }: { params: { workspaceId: string; roomId: string; messageId: string } }
) {
  const { workspaceId, roomId, messageId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // We'll use a transaction to ensure all operations are atomic
    return await prisma.$transaction(async (tx) => {
      // Check if the message exists
      const message = await tx.chatMessage.findUnique({
        where: { id: messageId },
        include: {
          chatRoom: {
            select: {
              workspaceId: true
            }
          }
        }
      });
      
      if (!message) {
        return NextResponse.json({ error: "Message not found" }, { status: 404 });
      }
      
      if (message.chatRoomId !== roomId) {
        return NextResponse.json({ error: "Message not in this room" }, { status: 400 });
      }
      
      if (message.chatRoom.workspaceId !== workspaceId) {
        return NextResponse.json({ error: "Message not in this workspace" }, { status: 400 });
      }

      // Check if user is the message owner or a room admin or workspace owner
      const isRoomAdmin = await tx.chatRoomMember.findFirst({
        where: {
          chatRoomId: roomId,
          userId: session.user.id,
          isAdmin: true
        }
      });
      
      const workspace = await tx.workspace.findUnique({
        where: { id: workspaceId }
      });
      
      const isWorkspaceOwner = workspace?.userId === session.user.id;
      const isMessageOwner = message.userId === session.user.id;
      
      if (!isMessageOwner && !isRoomAdmin && !isWorkspaceOwner) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }

      // Save message details for socket notification before deletion
      const messageDetails = {
        id: message.id,
        chatRoomId: message.chatRoomId,
        userId: message.userId,
        createdAt: message.createdAt
      };

      // Delete the message (cascade will delete reactions and attachments)
      await tx.chatMessage.delete({
        where: { id: messageId }
      });
      // Emit real-time event for message deletion
      try {
        const socketPayload = {
          event: "messageDeleted",
          roomId: `${workspaceId}:${roomId}`,
          message: messageDetails
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

      return NextResponse.json({ 
        success: true,
        message: "Message deleted successfully"
      });
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message", details: (error as Error).message },
      { status: 500 }
    );
  }
}