/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/workspaces/[workspaceId]/chat/rooms/[roomId]/attachments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// POST - Upload attachment (handles the metadata - frontend would handle actual file upload)
export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string; roomId: string } }
) {
  const { workspaceId, roomId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { fileName, fileType, fileSize, fileUrl, messageId } = await req.json();

  try {
    // Check if the message exists and belongs to the user
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });
    
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    
    if (message.chatRoomId !== roomId) {
      return NextResponse.json({ error: "Message not in this room" }, { status: 400 });
    }
    
    if (message.userId !== session.user.id) {
      return NextResponse.json({ error: "Can only attach to your own messages" }, { status: 403 });
    }

    // Create the attachment
    const attachment = await prisma.chatAttachment.create({
      data: {
        messageId,
        fileName,
        fileType,
        fileSize,
        fileUrl
      }
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.error("Error adding attachment:", error);
    return NextResponse.json(
      { error: "Failed to add attachment" },
      { status: 500 }
    );
  }
}

// GET - List all attachments in a chat room
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
    // Check if user has access to the room
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId }
    });
    
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 });
    }
    
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
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Get pagination parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const page = parseInt(url.searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    const fileType = url.searchParams.get("fileType"); // Optional filter by file type

    // Build the query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {
      message: {
        chatRoomId: roomId
      }
    };
    
    if (fileType) {
      whereClause.fileType = {
        startsWith: fileType
      };
    }

    // Get attachments with pagination
    const attachments = await prisma.chatAttachment.findMany({
      where: whereClause,
      include: {
        message: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.chatAttachment.count({
      where: whereClause
    });

    return NextResponse.json({
      attachments,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}