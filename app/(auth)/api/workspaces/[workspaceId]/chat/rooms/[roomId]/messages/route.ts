/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/workspaces/[workspaceId]/chat/rooms/[roomId]/messages/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

import { notifyChatMessage } from "@/lib/notifications";

// POST - Send a new message
export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string; roomId: string } }
) {
  const { workspaceId, roomId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { content, replyToId, attachments = [] } = await req.json();
    
    // Validate content
    if ((!content || !content.trim()) && attachments.length === 0) {
      return NextResponse.json({ error: "Message must contain content or attachments" }, { status: 400 });
    }

    // Check workspace first
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

    // Check if user is a member of the chat room
    const roomMembership = await prisma.chatRoomMember.findUnique({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId: session.user.id
        }
      }
    });
    
    if (!roomMembership) {
      // Check if room is public and user is workspace member before allowing message
      if (chatRoom.isPrivate) {
        return NextResponse.json({ error: "Not a member of this private room" }, { status: 403 });
      }
      
      // For public rooms, verify workspace membership
      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: session.user.id
        }
      });
      
      if (!workspaceMember) {
        return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
      }
      
      // Auto-join the user to the public room
      await prisma.chatRoomMember.create({
        data: {
          chatRoomId: roomId,
          userId: session.user.id,
          isAdmin: false
        }
      });
    }

    // Process attachments if any
    let processedAttachments = [];
    if (attachments.length > 0) {
      processedAttachments = attachments.map((attachment: { fileName: any; fileType: any; fileSize: any; fileUrl: any; }) => ({
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        fileUrl: attachment.fileUrl
      }));
    }

    // Validate replyToId if provided
    if (replyToId) {
      const replyMessage = await prisma.chatMessage.findUnique({
        where: { id: replyToId }
      });
      
      if (!replyMessage || replyMessage.chatRoomId !== roomId) {
        return NextResponse.json({ error: "Invalid reply message" }, { status: 400 });
      }
    }

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        content: content || "",
        userId: session.user.id,
        chatRoomId: roomId,
        ...(replyToId && { replyToId }),
        ...(processedAttachments.length > 0 && {
          attachments: {
            create: processedAttachments
          }
        })
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

    // Get all room members to notify about the new message
    const roomMembers = await prisma.chatRoomMember.findMany({
      where: {
        chatRoomId: roomId
      },
      select: {
        userId: true
      }
    });

    // Check for mentions in the message content
    // Basic implementation checking for @username format
    // You may want to implement a more sophisticated mention detection system
    const mentionPattern = /@(\w+)/g;
    const mentions = content ? [...content.matchAll(mentionPattern)].map(match => match[1]) : [];
    
    let mentionedUserIds: string[] = [];
    
    // If there are mentions, get the user IDs of mentioned users
    if (mentions.length > 0) {
      const mentionedUsers = await prisma.user.findMany({
        where: {
          OR: mentions.map(username => ({
            name: {
              contains: username,
              mode: 'insensitive'
            }
          }))
        },
        select: {
          id: true
        }
      });
      
      mentionedUserIds = mentionedUsers.map(user => user.id);
    }

    // Create notifications for room members
    // Filter out members who have notifications disabled (if you have that setting)
    const recipientIds = roomMembers.map(member => member.userId);
    
    // Get the sender's name
    const senderName = message.user.name || 'Unknown User';
    
    // Send notifications
    if (recipientIds.length > 0) {
      try {
        // For users who were mentioned, we'll send a mention notification
        if (mentionedUserIds.length > 0) {
          await notifyChatMessage({
            messageId: message.id,
            messageContent: content || '',
            senderId: session.user.id,
            senderName: senderName,
            workspaceId,
            chatRoomId: roomId,
            chatRoomName: chatRoom.name || 'Chat',
            recipientIds: mentionedUserIds,
            isPrivate: chatRoom.isPrivate,
            isMention: true
          });
        }
        
        // For all other users, send a regular message notification
        const nonMentionedRecipients = recipientIds.filter(id => 
          !mentionedUserIds.includes(id) && id !== session.user.id
        );
        
        if (nonMentionedRecipients.length > 0) {
          await notifyChatMessage({
            messageId: message.id,
            messageContent: content || '',
            senderId: session.user.id,
            senderName: senderName,
            workspaceId,
            chatRoomId: roomId,
            chatRoomName: chatRoom.name || 'Chat',
            recipientIds: nonMentionedRecipients,
            isPrivate: chatRoom.isPrivate,
            isMention: false
          });
        }
      } catch (notificationError) {
        console.error("Error sending notifications:", notificationError);
        // Continue with the process even if notifications fail
      }
    }

    // Update the chat room's updatedAt timestamp
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() }
    });

    const combinedRoomId = `${workspaceId}:${roomId}`;

    // Emit real-time event for new message
    try {
      const socketPayload = {
        event: "newMessage",
        roomId: combinedRoomId,
        message: message
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

    console.log("Message sent successfully:", message.id);
    return NextResponse.json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET - Fetch messages with pagination
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
    // Check workspace first
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
    
    // Check if user is a member of the workspace
    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id
      }
    });
    
    if (!workspaceMember) {
      return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
    }
    
    // Check if user is a member of the chat room or if the room is public
    const isMember = await prisma.chatRoomMember.findUnique({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId: session.user.id
        }
      }
    });
    
    if (chatRoom.isPrivate && !isMember) {
      return NextResponse.json({ error: "Access denied to private room" }, { status: 403 });
    }

    // Update last read timestamp for this user if they're a member
    if (isMember) {
      await prisma.chatRoomMember.update({
        where: {
          id: isMember.id
        },
        data: {
          lastReadAt: new Date()
        }
      });
    }

    // Fetch messages with pagination
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
      messages,
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages", details: (error as Error).message },
      { status: 500 }
    );
  }
}