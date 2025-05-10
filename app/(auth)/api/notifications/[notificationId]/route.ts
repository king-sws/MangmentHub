
// app/api/notifications/[notificationId]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { notificationId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const notification = await prisma.notification.findUnique({
      where: {
        id: params.notificationId,
      },
    });
    
    if (!notification || notification.userId !== session.user.id) {
      return new NextResponse("Notification not found", { status: 404 });
    }
    
    return NextResponse.json(notification);
  } catch (error) {
    console.error("[NOTIFICATION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH - Mark a notification as read
export async function PATCH(
  req: Request,
  { params }: { params: { notificationId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const body = await req.json();
    const { isRead } = body;
    
    const notification = await prisma.notification.findUnique({
      where: {
        id: params.notificationId,
      },
    });
    
    if (!notification || notification.userId !== session.user.id) {
      return new NextResponse("Notification not found", { status: 404 });
    }
    
    const updatedNotification = await prisma.notification.update({
      where: {
        id: params.notificationId,
      },
      data: {
        isRead,
      },
    });
    
    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error("[NOTIFICATION_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE - Delete a notification
export async function DELETE(
  req: Request,
  { params }: { params: { notificationId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const notification = await prisma.notification.findUnique({
      where: {
        id: params.notificationId,
      },
    });
    
    if (!notification || notification.userId !== session.user.id) {
      return new NextResponse("Notification not found", { status: 404 });
    }
    
    await prisma.notification.delete({
      where: {
        id: params.notificationId,
      },
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[NOTIFICATION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}