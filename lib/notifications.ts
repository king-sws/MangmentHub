// lib/notifications.ts
import { prisma } from "@/lib/prisma";

// Define notification types
export const NotificationType = {
  TASK_ASSIGNED: "TASK_ASSIGNED",
  TASK_DUE_SOON: "TASK_DUE_SOON",
  TASK_COMPLETED: "TASK_COMPLETED",
  TASK_COMMENT: "TASK_COMMENT",
  INVITATION: "INVITATION",
  INVITATION_ACCEPTED: "INVITATION_ACCEPTED",
  INVITATION_DECLINED: "INVITATION_DECLINED",
  WORKSPACE_JOIN: "WORKSPACE_JOIN",
  WORKSPACE_ROLE_CHANGE: "WORKSPACE_ROLE_CHANGE",
  CHAT_MESSAGE: "CHAT_MESSAGE", // Added new notification type
};

// Generic notification creation function
export async function createNotification({
  userId,
  title,
  message,
  type,
  linkTo,
  relatedId,
}: {
  userId: string;
  title: string;
  message: string;
  type: string;
  linkTo?: string | null;
  relatedId?: string | null;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        linkTo,
        relatedId,
      },
    });
    
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

// Task assignment notification
export async function notifyTaskAssigned({
  taskId,
  taskTitle,
  assigneeId,
  assignerId,
  assignerName,
}: {
  taskId: string;
  taskTitle: string;
  assigneeId: string;
  assignerId: string;
  assignerName: string;
}) {
  // Create notification for assignee
  const assigneeNotification = await createNotification({
    userId: assigneeId,
    title: "New Task Assigned",
    message: `${assignerName} assigned you to task: ${taskTitle}`,
    type: NotificationType.TASK_ASSIGNED,
    linkTo: `/dashboard/tasks/${taskId}`,
    relatedId: taskId,
  });
  
  // If assigner and assignee are different, create a confirmation notification for assigner
  if (assignerId !== assigneeId) {
    const assignerNotification = await createNotification({
      userId: assignerId,
      title: "Task Assigned",
      message: `You assigned a task: ${taskTitle}`,
      type: NotificationType.TASK_ASSIGNED,
      linkTo: `/dashboard/tasks/${taskId}`,
      relatedId: taskId,
    });
    
    return [assigneeNotification, assignerNotification].filter(Boolean);
  }
  
  return assigneeNotification;
}

// Chat message notification
export async function notifyChatMessage({
  messageId,
  messageContent,
  senderId,
  senderName,
  workspaceId,
  chatRoomId,
  chatRoomName,
  recipientIds,
  isPrivate = false,
  isMention = false,
}: {
  messageId: string;
  messageContent: string;
  senderId: string;
  senderName: string;
  workspaceId: string;
  chatRoomId: string;
  chatRoomName: string;
  recipientIds: string[];
  isPrivate?: boolean;
  isMention?: boolean;
}) {
  const notifications = [];
  
  // Truncate message content for notification to prevent very long notifications
  const MAX_PREVIEW_LENGTH = 50;
  const truncatedContent = messageContent.length > MAX_PREVIEW_LENGTH 
    ? `${messageContent.substring(0, MAX_PREVIEW_LENGTH)}...` 
    : messageContent;
  
  for (const recipientId of recipientIds) {
    // Don't notify the sender about their own message
    if (recipientId !== senderId) {
      const title = isMention 
        ? "You were mentioned" 
        : isPrivate 
          ? "New private message" 
          : "New message";
      
      const message = isMention
        ? `${senderName} mentioned you in ${chatRoomName}: ${truncatedContent}`
        : `${senderName} in ${chatRoomName}: ${truncatedContent}`;
      
      const notification = await createNotification({
        userId: recipientId,
        title,
        message,
        type: NotificationType.CHAT_MESSAGE,
        linkTo: `/dashboard/workspaces/${workspaceId}/chat/${chatRoomId}?messageId=${messageId}`,
        relatedId: messageId,
      });
      
      if (notification) {
        notifications.push(notification);
      }
    }
  }
  
  return notifications;
}

// Task due soon notification
export async function notifyTaskDueSoon({
  taskId,
  taskTitle,
  userId,
  dueDate,
}: {
  taskId: string;
  taskTitle: string;
  userId: string;
  dueDate: Date;
}) {
  const formattedDate = dueDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  
  return createNotification({
    userId,
    title: "Task Due Soon",
    message: `Task "${taskTitle}" is due on ${formattedDate}`,
    type: NotificationType.TASK_DUE_SOON,
    linkTo: `/dashboard/tasks/${taskId}`,
    relatedId: taskId,
  });
}

// Task completed notification (notify task creator or board owner)
export async function notifyTaskCompleted({
  taskId,
  taskTitle,
  completedById,
  completedByName,
  ownerId,
  assigneeIds,
}: {
  taskId: string;
  taskTitle: string;
  completedById: string;
  completedByName: string;
  ownerId: string;
  assigneeIds?: string[]; // Optional array of other assignees to notify
}) {
  const notifications = [];
  
  // Notify owner if different from completer
  if (ownerId !== completedById) {
    const ownerNotification = await createNotification({
      userId: ownerId,
      title: "Task Completed",
      message: `${completedByName} completed task: ${taskTitle}`,
      type: NotificationType.TASK_COMPLETED,
      linkTo: `/dashboard/tasks/${taskId}`,
      relatedId: taskId,
    });
    
    if (ownerNotification) {
      notifications.push(ownerNotification);
    }
  }
  
  // Notify other assignees if provided
  if (assigneeIds?.length) {
    for (const assigneeId of assigneeIds) {
      // Don't notify the person who completed the task
      if (assigneeId !== completedById) {
        const assigneeNotification = await createNotification({
          userId: assigneeId,
          title: "Task Completed",
          message: `${completedByName} completed a task you're assigned to: ${taskTitle}`,
          type: NotificationType.TASK_COMPLETED,
          linkTo: `/dashboard/tasks/${taskId}`,
          relatedId: taskId,
        });
        
        if (assigneeNotification) {
          notifications.push(assigneeNotification);
        }
      }
    }
  }
  
  return notifications;
}

// Task comment notification
export async function notifyTaskComment({
  taskId,
  taskTitle,
  commenterId,
  commenterName,
  recipientIds,
}: {
  taskId: string;
  taskTitle: string;
  commenterId: string;
  commenterName: string;
  recipientIds: string[]; // IDs of all users who should be notified (owner, assignees)
}) {
  const notifications = [];
  
  for (const recipientId of recipientIds) {
    // Don't notify the commenter about their own comment
    if (recipientId !== commenterId) {
      const notification = await createNotification({
        userId: recipientId,
        title: "New Comment",
        message: `${commenterName} commented on task: ${taskTitle}`,
        type: NotificationType.TASK_COMMENT,
        linkTo: `/dashboard/tasks/${taskId}`,
        relatedId: taskId,
      });
      
      if (notification) {
        notifications.push(notification);
      }
    }
  }
  
  return notifications;
}

// Workspace invitation notification
export async function notifyInvitation({
  email,
  workspaceName,
  inviterName,
  inviterId,
  workspaceId, 
}: {
  email: string;
  workspaceName: string;
  inviterName: string;
  inviterId: string;
  workspaceId: string;
}) {
  // Try to find user with this email (potential recipient)
  const invitee = await prisma.user.findUnique({
    where: { email },
  });
  
  // Create notification results to return
  const notifications = [];
  
  // If invitee exists in the system, create notification for them
  if (invitee) {
    const inviteeNotification = await createNotification({
      userId: invitee.id,
      title: "Workspace Invitation",
      message: `${inviterName} invited you to join workspace: ${workspaceName}`,
      type: NotificationType.INVITATION,
      linkTo: `/dashboard/invitations`,
      relatedId: workspaceId,
    });
    
    if (inviteeNotification) {
      notifications.push(inviteeNotification);
    }
  }
  
  // Always create a notification for the inviter as well
  const inviterNotification = await createNotification({
    userId: inviterId,
    title: "Invitation Sent",
    message: `You invited ${email} to join workspace: ${workspaceName}`,
    type: NotificationType.INVITATION,
    linkTo: `/dashboard/workspaces/${workspaceId}/members`,
    relatedId: workspaceId,
  });
  
  if (inviterNotification) {
    notifications.push(inviterNotification);
  }
  
  // Return all created notifications
  return notifications;
}

// Notification for when an invitation is accepted
export async function notifyInvitationAccepted({
  inviteeName,
  workspaceId,
  workspaceName,
  ownerId,
}: {
  inviteeId: string;
  inviteeName: string;
  workspaceId: string;
  workspaceName: string;
  ownerId: string;
}) {
  // Notify workspace owner that the invitation was accepted
  return createNotification({
    userId: ownerId,
    title: "Invitation Accepted",
    message: `${inviteeName} accepted your invitation to join ${workspaceName}`,
    type: NotificationType.INVITATION_ACCEPTED,
    linkTo: `/dashboard/workspaces/${workspaceId}/members`,
    relatedId: workspaceId,
  });
}

// Notification for when an invitation is declined
export async function notifyInvitationDeclined({
  inviteeEmail,
  workspaceId,
  workspaceName,
  ownerId,
}: {
  inviteeEmail: string;
  workspaceId: string;
  workspaceName: string;
  ownerId: string;
}) {
  // Notify workspace owner that the invitation was declined
  return createNotification({
    userId: ownerId,
    title: "Invitation Declined",
    message: `${inviteeEmail} declined your invitation to join ${workspaceName}`,
    type: NotificationType.INVITATION_DECLINED,
    linkTo: `/dashboard/workspaces/${workspaceId}/members`,
    relatedId: workspaceId,
  });
}

// New workspace member notification for workspace owner
export async function notifyNewMember({
  workspaceId,
  workspaceName,
  memberId,
  memberName,
  ownerId,
}: {
  workspaceId: string;
  workspaceName: string;
  memberId: string;
  memberName: string;
  ownerId: string;
}) {
  const notifications = [];
  
  // Notify workspace owner
  const ownerNotification = await createNotification({
    userId: ownerId,
    title: "New Workspace Member",
    message: `${memberName} joined your workspace: ${workspaceName}`,
    type: NotificationType.WORKSPACE_JOIN,
    linkTo: `/dashboard/workspaces/${workspaceId}/members`,
    relatedId: workspaceId,
  });
  
  if (ownerNotification) {
    notifications.push(ownerNotification);
  }
  
  // Notify the new member as well
  const memberNotification = await createNotification({
    userId: memberId,
    title: "Workspace Joined",
    message: `You have successfully joined workspace: ${workspaceName}`,
    type: NotificationType.WORKSPACE_JOIN,
    linkTo: `/dashboard/workspaces/${workspaceId}`,
    relatedId: workspaceId,
  });
  
  if (memberNotification) {
    notifications.push(memberNotification);
  }
  
  return notifications;
}

// Role change notification
export async function notifyRoleChange({
  userId,
  workspaceId,
  workspaceName,
  newRole,
  changedById,
  changedByName,
}: {
  userId: string;
  workspaceId: string;
  workspaceName: string;
  newRole: string;
  changedById: string;
  changedByName: string;
}) {
  const notifications = [];
  
  // Notify the user whose role was changed
  const userNotification = await createNotification({
    userId,
    title: "Role Changed",
    message: `${changedByName} changed your role in workspace ${workspaceName} to ${newRole}`,
    type: NotificationType.WORKSPACE_ROLE_CHANGE,
    linkTo: `/dashboard/workspaces/${workspaceId}`,
    relatedId: workspaceId,
  });
  
  if (userNotification) {
    notifications.push(userNotification);
  }
  
  // If changed by a different user, notify them as well
  if (userId !== changedById) {
    const changerNotification = await createNotification({
      userId: changedById,
      title: "Role Changed",
      message: `You changed the role for a member in workspace ${workspaceName}`,
      type: NotificationType.WORKSPACE_ROLE_CHANGE,
      linkTo: `/dashboard/workspaces/${workspaceId}/members`,
      relatedId: workspaceId,
    });
    
    if (changerNotification) {
      notifications.push(changerNotification);
    }
  }
  
  return notifications;
}

// Utility to fetch unread count
export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}