

// app/api/notifications/read-all/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });
    
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("[NOTIFICATIONS_READ_ALL]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
