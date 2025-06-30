// app/api/socket/route.ts
import { NextResponse } from 'next/server';

// This is needed to prevent Next.js from handling the socket.io path
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    { error: "This endpoint is for socket.io and is not meant to be accessed directly" },
    { status: 400 }
  );
}

