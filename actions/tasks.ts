// actions/tasks.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { CardStatus } from "@prisma/client";

// Get all tasks assigned to the current user
export async function getUserTasks(status?: CardStatus) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  const where = {
    assignees: {
      some: {
        id: session.user.id
      }
    },
    ...(status ? { status } : {})
  };
  
  const tasks = await prisma.card.findMany({
    where,
    include: {
      list: {
        include: {
          board: {
            include: {
              workspace: true
            }
          }
        }
      },
      assignees: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true
        }
      }
    },
    orderBy: [
      { dueDate: 'asc' },
      { createdAt: 'desc' }
    ]
  });
  
  return tasks;
}

// Get upcoming tasks (due within the next 7 days)
export async function getUpcomingTasks(limit?: number) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  const tasks = await prisma.card.findMany({
    where: {
      assignees: {
        some: {
          id: session.user.id
        }
      },
      dueDate: {
        gte: today,
        lte: nextWeek
      },
      completed: false
    },
    include: {
      list: {
        include: {
          board: {
            include: {
              workspace: true
            }
          }
        }
      },
      assignees: {
        select: {
          id: true,
          name: true,
          image: true
        }
      }
    },
    orderBy: { dueDate: 'asc' },
    take: limit || undefined
  });
  
  return tasks;
}

// Get completed tasks
export async function getCompletedTasks(limit?: number) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  const tasks = await prisma.card.findMany({
    where: {
      assignees: {
        some: {
          id: session.user.id
        }
      },
      completed: true
    },
    include: {
      list: {
        include: {
          board: {
            include: {
              workspace: true
            }
          }
        }
      },
      assignees: {
        select: {
          id: true,
          name: true,
          image: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: limit || undefined
  });
  
  return tasks;
}

// Get count of completed tasks
export async function getCompletedTasksCount() {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  const count = await prisma.card.count({
    where: {
      assignees: {
        some: {
          id: session.user.id
        }
      },
      completed: true
    }
  });
  
  return count;
}

// Get count of upcoming tasks due this week
export async function getUpcomingTasksCount() {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  const count = await prisma.card.count({
    where: {
      assignees: {
        some: {
          id: session.user.id
        }
      },
      dueDate: {
        gte: today,
        lte: nextWeek
      },
      completed: false
    }
  });
  
  return count;
}

// Update task status
export async function updateTaskStatus(id: string, status: CardStatus) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  // Verify user has access to this card
  const card = await prisma.card.findUnique({
    where: { id },
    include: {
      list: {
        include: {
          board: {
            include: {
              workspace: {
                include: {
                  members: true
                }
              }
            }
          }
        }
      },
      assignees: true
    }
  });
  
  if (!card) {
    throw new Error("Task not found");
  }
  
  // Check if user is a member of the workspace or assigned to the task
  const isWorkspaceMember = card.list.board.workspace.members.some(
    member => member.userId === session.user.id
  );
  
  const isAssignee = card.assignees.some(
    assignee => assignee.id === session.user.id
  );
  
  if (!isWorkspaceMember && !isAssignee) {
    throw new Error("You don't have permission to update this task");
  }
  
  // Update the card status
  const updatedCard = await prisma.card.update({
    where: { id },
    data: { 
      status,
      // If status is DONE, also mark as completed
      completed: status === CardStatus.DONE
    }
  });
  
  // Revalidate paths
  revalidatePath('/dashboard/[userId]');
  revalidatePath('/dashboard/[userId]/tasks');
  revalidatePath('/board/[boardId]');
  
  return updatedCard;
}

// Toggle task completion
export async function toggleTaskCompletion(id: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  // Get the current card
  const card = await prisma.card.findUnique({
    where: { id },
    include: {
      assignees: true,
      list: {
        include: {
          board: {
            include: {
              workspace: {
                include: {
                  members: true
                }
              }
            }
          }
        }
      }
    }
  });
  
  if (!card) {
    throw new Error("Task not found");
  }
  
  // Check if user is a member of the workspace or assigned to the task
  const isWorkspaceMember = card.list.board.workspace.members.some(
    member => member.userId === session.user.id
  );
  
  const isAssignee = card.assignees.some(
    assignee => assignee.id === session.user.id
  );
  
  if (!isWorkspaceMember && !isAssignee) {
    throw new Error("You don't have permission to update this task");
  }
  
  // Toggle completion status
  const completed = !card.completed;
  
  // Update the card
  const updatedCard = await prisma.card.update({
    where: { id },
    data: { 
      completed,
      // If marking as completed, also set status to DONE
      ...(completed ? { status: CardStatus.DONE } : {})
    }
  });
  
  // Revalidate paths
  revalidatePath('/dashboard/[userId]');
  revalidatePath('/dashboard/[userId]/tasks');
  revalidatePath('/board/[boardId]');
  
  return updatedCard;
}

// Assign task to user
export async function assignTaskToUser(cardId: string, userId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  // Check if the card exists
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      assignees: true,
      list: {
        include: {
          board: {
            include: {
              workspace: {
                include: {
                  members: true
                }
              }
            }
          }
        }
      }
    }
  });
  
  if (!card) {
    throw new Error("Task not found");
  }
  
  // Check if user is already assigned
  const isAlreadyAssigned = card.assignees.some(assignee => assignee.id === userId);
  
  if (isAlreadyAssigned) {
    return card; // User is already assigned, no action needed
  }
  
  // Update the card with the new assignee
  const updatedCard = await prisma.card.update({
    where: { id: cardId },
    data: {
      assignees: {
        connect: { id: userId }
      }
    },
    include: {
      assignees: true
    }
  });
  
  // Revalidate paths
  revalidatePath('/dashboard/[userId]');
  revalidatePath('/dashboard/[userId]/tasks');
  revalidatePath('/board/[boardId]');
  
  return updatedCard;
}

// Unassign task from user
export async function unassignTaskFromUser(cardId: string, userId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  // Check if the card exists
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      assignees: true
    }
  });
  
  if (!card) {
    throw new Error("Task not found");
  }
  
  // Update the card, removing the assignee
  const updatedCard = await prisma.card.update({
    where: { id: cardId },
    data: {
      assignees: {
        disconnect: { id: userId }
      }
    },
    include: {
      assignees: true
    }
  });
  
  // Revalidate paths
  revalidatePath('/dashboard/[userId]');
  revalidatePath('/dashboard/[userId]/tasks');
  revalidatePath('/board/[boardId]');
  
  return updatedCard;
}