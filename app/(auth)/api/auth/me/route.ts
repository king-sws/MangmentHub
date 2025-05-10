// app/api/user/me/route.ts
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUserFromToken(req);

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.json(user);
}
