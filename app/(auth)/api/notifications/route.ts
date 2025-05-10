// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch user notifications
export async function GET(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";
    
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
    
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });
    
    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST - Create a new notification (for internal use)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, title, message, type, linkTo, relatedId } = body;
    
    // Validate required fields
    if (!userId || !title || !message || !type) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    
    // Create notification
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
    
    return NextResponse.json(notification);
  } catch (error) {
    console.error("[NOTIFICATIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

