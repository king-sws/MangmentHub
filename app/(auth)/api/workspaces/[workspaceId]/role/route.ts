// api/workspaces/[workspaceId]/role/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: params.workspaceId
        }
      },
      select: { role: true }
    })

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    return NextResponse.json({ role: membership.role })
  } catch (error) {
    console.error("Error fetching workspace role:", error)
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 }
    )
  }
}