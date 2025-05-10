// app/api/tasks/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CardStatus } from "@prisma/client";
import { notifyTaskAssigned } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const assigneeId = url.searchParams.get("assigneeId");
    const projectId = url.searchParams.get("projectId"); // boardId in schema
    const dueDate = url.searchParams.get("dueDate");
    
    // Build where conditions
    const whereConditions: {
      list: {
        board: {
          workspace: {
            userId: string;
          };
        };
        boardId?: string;
      };
      status?: CardStatus;
      assignees?: { some: { id: string } };
      dueDate?: { lte: Date };
    } = {
      list: {
        board: {
          workspace: {
            userId: session.user.id,
          },
        },
      },
    };
    
    // Add optional filters
    if (status) {
      whereConditions.status = status as CardStatus;
    }
    
    if (assigneeId) {
      whereConditions.assignees = { some: { id: assigneeId } };
    }
    
    if (projectId) {
      whereConditions.list = {
        ...whereConditions.list,
        boardId: projectId
      };
    }
    
    // Filter by due date if provided
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      whereConditions.dueDate = {
        lte: dueDateObj
      };
    }
    
    const tasks = await prisma.card.findMany({
      where: whereConditions,
      include: {
        list: {
          include: {
            board: true,
          },
        },
        assignees: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { completed: "asc" },
        { dueDate: "asc" },
        { createdAt: "desc" }
      ],
    });
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[TASKS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await req.json();
    const { title, description, listId, dueDate, assigneeIds = [], status = "TODO" } = body;
    
    if (!title || !listId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    
    // Verify user has access to the list
    const list = await prisma.list.findUnique({
      where: { id: listId },
      include: {
        board: {
          include: {
            workspace: true,
          },
        },
      },
    });
    
    if (!list || list.board.workspace.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Calculate the new order
    const highestOrderCard = await prisma.card.findFirst({
      where: { listId },
      orderBy: { order: 'desc' },
    });
    
    const newOrder = highestOrderCard ? highestOrderCard.order + 1 : 0;
    
    // Create the new task
    const task = await prisma.card.create({
      data: {
        title,
        description,
        listId,
        order: newOrder,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status: status as CardStatus,
        assignees: {
          connect: assigneeIds.length > 0 
            ? assigneeIds.map((id: string) => ({ id })) 
            : undefined,
        },
      },
      include: {
        assignees: true,
        list: {
          include: {
            board: true,
          },
        },
      },
    });

    // If there are assignees, notify them
    if (assigneeIds && assigneeIds.length > 0) {
      // Get assigner name
      const assignerName = session.user.name || "A workspace manager";
      
      // Notify each assignee
      for (const assigneeId of assigneeIds) {
        try {
          await notifyTaskAssigned({
            taskId: task.id,
            taskTitle: task.title,
            assigneeId,
            assignerId: session.user.id,
            assignerName
          });
        } catch (notifError) {
          // Log but don't fail the whole operation if notification fails
          console.error("Failed to send task assignment notification:", notifError);
        }
      }
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASKS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}