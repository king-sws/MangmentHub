// api/users/check-email/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" }, 
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true } // We only need to know if the user exists
    });

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error("Error checking email:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}