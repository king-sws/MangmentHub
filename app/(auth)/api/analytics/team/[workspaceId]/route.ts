// /app/(auth)/api/analytics/team/[workspaceId]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { workspaceId } = params;
    
    // Check if user has access to this workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { userId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        user: true,
        members: {
          include: {
            user: true
          }
        }
      }
    });
    
    if (!workspace) {
      return new NextResponse("Workspace not found", { status: 404 });
    }
    
    // Get all users in the workspace including the owner
    const workspaceUsers = [
      { id: workspace.userId, name: workspace.user?.name || workspace.user?.email || "Owner" },
      ...workspace.members.map(member => ({
        id: member.user.id,
        name: member.user.name || member.user.email
      }))
    ];
    
    // Get all cards for the workspace
    const cards = await prisma.card.findMany({
      where: {
        list: {
          board: {
            workspaceId
          }
        }
      },
      include: {
        assignees: true
      }
    });
    
    // Calculate metrics for each user
    const teamMetrics = workspaceUsers.map(user => {
      const userCards = cards.filter(card => 
        card.assignees.some(assignee => assignee.id === user.id)
      );
      
      const totalAssigned = userCards.length;
      const completed = userCards.filter(card => card.completed).length;
      const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;
      
      const cardsByStatus = {
        BACKLOG: 0,
        TODO: 0,
        IN_PROGRESS: 0,
        IN_REVIEW: 0,
        DONE: 0
      };
      
      userCards.forEach(card => {
        cardsByStatus[card.status]++;
      });
      
      return {
        userId: user.id,
        name: user.name,
        metrics: {
          totalAssigned,
          completed,
          completionRate,
          cardsByStatus
        }
      };
    });
    
    // Sort by completion rate
    teamMetrics.sort((a, b) => b.metrics.completionRate - a.metrics.completionRate);
    
    return NextResponse.json({
      teamMetrics
    });
  } catch (error) {
    console.error("[TEAM_ANALYTICS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}