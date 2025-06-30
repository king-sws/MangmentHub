// app/api/workspaces/[workspaceId]/chat/rooms/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET - List all chat rooms in a workspace
export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const { workspaceId } = params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log(`[DEBUG] Listing chat rooms for workspace: ${workspaceId}, user: ${session.user.id}`);
    
    // First check if the workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });
    
    if (!workspace) {
      console.log(`[ERROR] Workspace not found: ${workspaceId}`);
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // If the user is the workspace owner, they automatically have access
    const isOwner = workspace.userId === session.user.id;
    console.log(`[DEBUG] User is workspace owner: ${isOwner}`);
    
    if (!isOwner) {
      // Check if user is a member of the workspace
      const isMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: session.user.id
        }
      });
      
      if (!isMember) {
        console.log(`[ERROR] User ${session.user.id} is not a member of workspace ${workspaceId}`);
        return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
      }
      
      console.log(`[DEBUG] User is workspace member with role: ${isMember.role}`);
    }

    // Get all chat rooms user has access to
    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        workspaceId,
        OR: [
          { isPrivate: false },
          {
            isPrivate: true,
            members: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      },
      include: {
        _count: {
          select: {
            members: true,
            messages: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    console.log(`[DEBUG] Found ${chatRooms.length} chat rooms for workspace`);
    return NextResponse.json(chatRooms);
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat rooms", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Create a new chat room
export async function POST(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const { workspaceId } = params;
  console.log(`[DEBUG] POST request to create chat room in workspace: ${workspaceId}`);
  
  const session = await auth();
  
  if (!session?.user?.id) {
    console.log(`[ERROR] Unauthorized attempt to create chat room`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const body = await req.json();
    const { name, description, isPrivate = false, initialMembers = [] } = body;
    
    console.log(`[DEBUG] Creating chat room. Workspace: ${workspaceId}, User: ${session.user.id}`);
    console.log(`[DEBUG] Room details: Name: ${name}, Private: ${isPrivate}`);
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Chat room name is required" },
        { status: 400 }
      );
    }

    // First check if the workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });
    
    if (!workspace) {
      console.log(`[ERROR] Workspace not found: ${workspaceId}`);
      return NextResponse.json({ error: "Workspace not found", workspaceId }, { status: 404 });
    }

    // If the user is the workspace owner, they automatically have access
    const isOwner = workspace.userId === session.user.id;
    console.log(`[DEBUG] User is workspace owner: ${isOwner}`);
    
    let currentMember = null;
    
    if (!isOwner) {
      // Check if user is a member of the workspace
      currentMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: session.user.id
        }
      });
      
      if (!currentMember) {
        console.log(`[ERROR] User ${session.user.id} is not a member of workspace ${workspaceId}`);
        return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
      }
      
      console.log(`[DEBUG] User is workspace member with role: ${currentMember.role}`);
    }

    // Validate that all initialMembers are workspace members
    if (initialMembers.length > 0) {
      const validMembers = await prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          userId: {
            in: initialMembers
          }
        },
        select: {
          userId: true
        }
      });
      
      const validMemberIds = validMembers.map(member => member.userId);
      
      // Filter out any invalid member IDs
      const validInitialMembers: string[] = initialMembers.filter((id: string) => 
        validMemberIds.includes(id) && id !== session.user.id
      );
      
      console.log(`[DEBUG] Valid initial members: ${validInitialMembers.length}`);
      
      // Create the chat room with valid members
      const chatRoom = await prisma.chatRoom.create({
        data: {
          name,
          description,
          isPrivate,
          workspaceId,
          members: {
            create: [
              // Always add the creator as an admin
              {
                userId: session.user.id,
                isAdmin: true
              },
              // Add other initial members if provided
              ...validInitialMembers.map((userId: string) => ({
                userId,
                isAdmin: false
              }))
            ]
          }
        },
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

      console.log(`[DEBUG] Chat room created with ID: ${chatRoom.id}`);
      return NextResponse.json(chatRoom);
    } else {
      // Create chat room with just the creator
      const chatRoom = await prisma.chatRoom.create({
        data: {
          name,
          description,
          isPrivate,
          workspaceId,
          members: {
            create: [
              {
                userId: session.user.id,
                isAdmin: true
              }
            ]
          }
        },
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

      console.log(`[DEBUG] Chat room created with ID: ${chatRoom.id}`);
      return NextResponse.json(chatRoom);
    }
  } catch (error) {
    console.error("Error creating chat room:", error);
    return NextResponse.json(
      { error: "Failed to create chat room", details: (error as Error).message },
      { status: 500 }
    );
  }
}