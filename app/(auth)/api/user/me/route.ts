// FILE: app/api/user/me/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true,
        // Add provider info from accounts
        accounts: {
          select: {
            provider: true
          }
        }
      },
    });
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    // Determine if user is using credentials or a provider
    const provider = user.accounts.length > 0
      ? user.accounts[0].provider
      : "credentials";
    
    // Remove accounts data from response
    const {...userData } = user;
    
    return NextResponse.json({
      ...userData,
      provider
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}