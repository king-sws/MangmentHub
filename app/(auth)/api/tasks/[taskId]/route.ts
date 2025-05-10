// app/api/tasks/[taskId]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyTaskAssigned, notifyTaskCompleted } from "@/lib/notifications";

export async function GET(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const task = await prisma.card.findUnique({
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
        assignees: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    if (!task || task.list.board.workspace.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

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
    
    // Update the task
    const updatedTask = await prisma.card.update({
      where: {
        id: params.taskId,
      },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        listId: listId !== undefined ? listId : undefined,
        dueDate: dueDate !== undefined ? new Date(dueDate) : undefined,
        status: status !== undefined ? status : undefined,
        completed: completed !== undefined ? completed : undefined,
        ...(assigneeIds !== undefined ? {
          assignees: {
            set: assigneeIds.map((id: string) => ({ id })),
          }
        } : {}),
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
    
    // Check if task was just completed
    if (completed === true && !existingTask.completed) {
      // Get assignee IDs for notification
      const assigneeIds = existingTask.assignees.map(a => a.id);
      
      // Notify the workspace owner about task completion
      await notifyTaskCompleted({
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        completedById: session.user.id,
        completedByName: session.user.name || "A team member",
        ownerId: existingTask.list.board.workspace.userId,
        assigneeIds: assigneeIds
      });
    }
    
    // If assignees changed, notify the new assignees
    if (assigneeIds !== undefined) {
      const newAssigneeIds = assigneeIds.filter((id: string) => !existingAssigneesIds.includes(id));
      
      if (newAssigneeIds.length > 0) {
        const assignerName = session.user.name || "A workspace manager";
        
        // Notify each new assignee
        for (const assigneeId of newAssigneeIds) {
          await notifyTaskAssigned({
            taskId: updatedTask.id,
            taskTitle: updatedTask.title,
            assigneeId,
            assignerId: session.user.id,
            assignerName
          });
        }
      }
    }
    
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("[TASK_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
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
      },
    });
    
    if (!existingTask || existingTask.list.board.workspace.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    await prisma.card.delete({
      where: {
        id: params.taskId,
      },
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TASK_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}