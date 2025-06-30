/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/workspaces/[workspaceId]/chat/rooms/[roomId]/messages/[messageId]/reactions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET - Get all reactions for a message
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
    // Check if message exists and is in the right room
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });
    
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    
    if (message.chatRoomId !== roomId) {
      return NextResponse.json({ error: "Message not in this room" }, { status: 400 });
    }

    // Check if user has access to the room
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId }
    });
    
    if (chatRoom?.isPrivate) {
      const isMember = await prisma.chatRoomMember.findUnique({
        where: {
          chatRoomId_userId: {
            chatRoomId: roomId,
            userId: session.user.id
          }
        }
      });
      
      if (!isMember) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Get reactions
    const reactions = await prisma.chatReaction.findMany({
      where: { messageId },
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

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: []
        };
      }
      
      acc[reaction.emoji].count += 1;
      acc[reaction.emoji].users.push({
        id: reaction.user.id,
        name: reaction.user.name,
        image: reaction.user.image
      });
      
      return acc;
    }, {} as Record<string, { emoji: string; count: number; users: any[] }>);

    return NextResponse.json(Object.values(groupedReactions));
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}

// POST - Add a reaction to a message
export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string; roomId: string; messageId: string } }
) {
  const { workspaceId, roomId, messageId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { emoji } = await req.json();

  try {
    // Check if message exists and is in the right room
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });
    
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    
    if (message.chatRoomId !== roomId) {
      return NextResponse.json({ error: "Message not in this room" }, { status: 400 });
    }

    // Check if user is a member of the room if private
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId }
    });
    
    if (chatRoom?.isPrivate) {
      const isMember = await prisma.chatRoomMember.findUnique({
        where: {
          chatRoomId_userId: {
            chatRoomId: roomId,
            userId: session.user.id
          }
        }
      });
      
      if (!isMember) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Check if user has already reacted with this emoji
    const existingReaction = await prisma.chatReaction.findFirst({
      where: {
        messageId,
        userId: session.user.id,
        emoji
      }
    });
    
    if (existingReaction) {
      // If reaction already exists, remove it (toggle behavior)
      await prisma.chatReaction.delete({
        where: { id: existingReaction.id }
      });
      
      return NextResponse.json({ removed: true, emoji });
    }

    // Create the reaction
    const reaction = await prisma.chatReaction.create({
      data: {
        messageId,
        userId: session.user.id,
        emoji
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

    return NextResponse.json(reaction);
  } catch (error) {
    console.error("Error managing reaction:", error);
    return NextResponse.json(
      { error: "Failed to manage reaction" },
      { status: 500 }
    );
  }
}

// DELETE - Remove all reactions of a specific emoji by the current user
export async function DELETE(
  req: Request,
  { params }: { params: { workspaceId: string; roomId: string; messageId: string } }
) {
  const { workspaceId, roomId, messageId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const url = new URL(req.url);
  const emoji = url.searchParams.get("emoji");
  
  if (!emoji) {
    return NextResponse.json({ error: "Emoji parameter required" }, { status: 400 });
  }

  try {
    // Check if message exists and is in the right room
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });
    
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    
    if (message.chatRoomId !== roomId) {
      return NextResponse.json({ error: "Message not in this room" }, { status: 400 });
    }

    // Delete the reaction
    const deleteResult = await prisma.chatReaction.deleteMany({
      where: {
        messageId,
        userId: session.user.id,
        emoji
      }
    });

    return NextResponse.json({ 
      success: true,
      removed: deleteResult.count > 0
    });
  } catch (error) {
    console.error("Error removing reaction:", error);
    return NextResponse.json(
      { error: "Failed to remove reaction" },
      { status: 500 }
    );
  }
}