// app/api/workspaces/user/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get workspaces where user is owner
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { userId: session.user.id }
    })
    
    // Get workspaces where user is a member
    const memberWorkspaces = await prisma.workspaceMember.findMany({
      where: {
        userId: session.user.id,
        workspaceId: {
          notIn: ownedWorkspaces.map(w => w.id)
        }
      },
      include: {
        workspace: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Combine and format responses
    const workspaces = [
      ...ownedWorkspaces.map(w => ({
        id: w.id,
        name: w.name,
        role: "OWNER", // Add role for owned workspaces
      })),
      ...memberWorkspaces.map(m => ({
        id: m.workspace.id,
        name: m.workspace.name,
        role: m.role,
        createdAt: m.createdAt
      }))
    ]
    
    
    return NextResponse.json({ workspaces }, { status: 200 })
  } catch (error) {
    console.error("Error fetching user workspaces:", error)
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    )
  }
}