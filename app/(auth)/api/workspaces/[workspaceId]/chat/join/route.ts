// app/api/workspaces/[workspaceId]/chat/join/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// POST - Join a public chat room
export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const { workspaceId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { roomId } = await req.json();

  try {
    // Check if user is a workspace member
    const isWorkspaceMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: session.user.id
      }
    });
    
    if (!isWorkspaceMember) {
      return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
    }

    // Check if the chat room exists and is public
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { 
        id: roomId,
        workspaceId // Ensure the room belongs to the workspace
      }
    });
    
    if (!chatRoom) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 });
    }
    
    if (chatRoom.isPrivate) {
      return NextResponse.json({ error: "Cannot join private rooms" }, { status: 403 });
    }

    // Check if already a member
    const existingMembership = await prisma.chatRoomMember.findUnique({
      where: {
        chatRoomId_userId: {
          chatRoomId: roomId,
          userId: session.user.id
        }
      }
    });
    
    if (existingMembership) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }

    // Add user to the room
    const membership = await prisma.chatRoomMember.create({
      data: {
        chatRoomId: roomId,
        userId: session.user.id,
        isAdmin: false
      },
      include: {
        chatRoom: true,
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

    // Optional: Create a system message in the room announcing the join
    await prisma.chatMessage.create({
      data: {
        chatRoomId: roomId,
        userId: session.user.id, // This will be shown as the user who joined
        content: `${session.user.name || "User"} joined the room`,
        isSystemMessage: true
      }
    });

    return NextResponse.json(membership);
  } catch (error) {
    console.error("Error joining chat room:", error);
    return NextResponse.json(
      { error: "Failed to join chat room" },
      { status: 500 }
    );
  }
}