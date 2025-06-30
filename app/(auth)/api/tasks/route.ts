/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/tasks/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CardStatus } from "@prisma/client";
import { notifyTaskAssigned, notifyTaskCompleted } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const assigneeId = url.searchParams.get("assigneeId");
    const projectId = url.searchParams.get("projectId");
    const dueDate = url.searchParams.get("dueDate");
    const search = url.searchParams.get("search");
    
    // Build where conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereConditions: any = {
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
    
    // Add search filter
    if (search) {
      whereConditions.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
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


// Define status configuration for better maintainability
const STATUS_CONFIG = {
  TODO: { completed: false, isActive: true },
  IN_PROGRESS: { completed: false, isActive: true },
  DONE: { completed: true, isActive: false },
  CANCELLED: { completed: false, isActive: false },
  ON_HOLD: { completed: false, isActive: false }
} as const;

export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await req.json();
    const { title, description, listId, dueDate, assigneeIds, status, completed } = body;
    
    // Check task exists and user has access
    const existingTask = await prisma.card.findUnique({
      where: {
        id: params.taskId,
      },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true,
              },
            },
          },
        },
        assignees: true
      },
    });
    
    if (!existingTask || existingTask.list.board.workspace.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get existing assignees to compare later
    const existingAssigneesIds = existingTask.assignees.map(a => a.id);
    
    // Build update data object
    const updateData: any = {};
    
    // Handle basic fields
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (listId !== undefined) updateData.listId = listId;
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    
    // Handle completion and status logic with all 5 statuses
    let finalCompleted = existingTask.completed;
    let finalStatus = existingTask.status;
    
    // If completed is explicitly provided, use it and update status accordingly
    if (completed !== undefined) {
      finalCompleted = completed;
      
      // If no status is provided, auto-set status based on completion
      if (status === undefined) {
        if (completed) {
          finalStatus = "DONE";
        } else {
          // If unchecking completion, revert to appropriate status
          // If current status is DONE, revert to TODO, otherwise keep current status
          finalStatus = existingTask.status === "DONE" ? "TODO" : existingTask.status;
        }
      } else {
        finalStatus = status as CardStatus;
      }
    }
    // If only status is provided, update completion based on status
    else if (status !== undefined) {
      finalStatus = status as CardStatus;
      
      // Use configuration to determine completion state
      const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
      if (statusConfig) {
        finalCompleted = statusConfig.completed;
      } else {
        // Fallback for unknown statuses
        console.warn(`Unknown status: ${status}`);
        finalCompleted = existingTask.completed;
      }
    }
    
    // Apply the computed values
    updateData.completed = finalCompleted;
    updateData.status = finalStatus;
    
    // Handle assignees
    if (assigneeIds !== undefined) {
      updateData.assignees = {
        set: assigneeIds.map((id: string) => ({ id })),
      };
    }
    
    // Update the task
    const updatedTask = await prisma.card.update({
      where: {
        id: params.taskId,
      },
      data: updateData,
      include: {
        assignees: true,
        list: {
          include: {
            board: true,
          },
        },
      },
    });
    
    // Check if task was just completed
    if (finalCompleted === true && !existingTask.completed) {
      try {
        // Get assignee IDs for notification
        const assigneeIdsForNotification = existingTask.assignees.map(a => a.id);
        
        // Notify the workspace owner about task completion
        await notifyTaskCompleted({
          taskId: updatedTask.id,
          taskTitle: updatedTask.title,
          completedById: session.user.id,
          completedByName: session.user.name || "A team member",
          ownerId: existingTask.list.board.workspace.userId,
          assigneeIds: assigneeIdsForNotification
        });
      } catch (notifError) {
        console.error("Failed to send task completion notification:", notifError);
        // Don't fail the request if notification fails
      }
    }
    
    // If assignees changed, notify the new assignees
    if (assigneeIds !== undefined) {
      const newAssigneeIds = assigneeIds.filter((id: string) => !existingAssigneesIds.includes(id));
      
      if (newAssigneeIds.length > 0) {
        const assignerName = session.user.name || "A workspace manager";
        
        // Notify each new assignee
        for (const assigneeId of newAssigneeIds) {
          try {
            await notifyTaskAssigned({
              taskId: updatedTask.id,
              taskTitle: updatedTask.title,
              assigneeId,
              assignerId: session.user.id,
              assignerName
            });
          } catch (notifError) {
            console.error("Failed to send task assignment notification:", notifError);
            // Don't fail the request if notification fails
          }
        }
      }
    }
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("[TASK_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}