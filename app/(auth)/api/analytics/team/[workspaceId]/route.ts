// // /app/(auth)/api/analytics/team/[workspaceId]/route.ts
// import { NextResponse } from "next/server";
// import { auth } from "@/auth";
// import { prisma } from "@/lib/prisma";

// export async function GET(
//   req: Request,
//   { params }: { params: { workspaceId: string } }
// ) {
//   try {
//     const session = await auth();
    
//     if (!session?.user?.email) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }
    
//     const { workspaceId } = params;
    
//     // Check if user has access to this workspace
//     const workspace = await prisma.workspace.findFirst({
//       where: {
//         id: workspaceId,
//         OR: [
//           { userId: session.user.id },
//           { members: { some: { userId: session.user.id } } }
//         ]
//       },
//       include: {
//         user: true,
//         members: {
//           include: {
//             user: true
//           }
//         }
//       }
//     });
    
//     if (!workspace) {
//       return new NextResponse("Workspace not found", { status: 404 });
//     }
    
//     // Get all users in the workspace including the owner
//     const workspaceUsers = [
//       { id: workspace.userId, name: workspace.user?.name || workspace.user?.email || "Owner" },
//       ...workspace.members.map(member => ({
//         id: member.user.id,
//         name: member.user.name || member.user.email
//       }))
//     ];
    
//     // Get all cards for the workspace
//     const cards = await prisma.card.findMany({
//       where: {
//         list: {
//           board: {
//             workspaceId
//           }
//         }
//       },
//       include: {
//         assignees: true
//       }
//     });
    
//     // Calculate metrics for each user
//     const teamMetrics = workspaceUsers.map(user => {
//       const userCards = cards.filter(card => 
//         card.assignees.some(assignee => assignee.id === user.id)
//       );
      
//       const totalAssigned = userCards.length;
//       const completed = userCards.filter(card => card.completed).length;
//       const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;
      
//       const cardsByStatus = {
//         BACKLOG: 0,
//         TODO: 0,
//         IN_PROGRESS: 0,
//         IN_REVIEW: 0,
//         DONE: 0
//       };
      
//       userCards.forEach(card => {
//         cardsByStatus[card.status]++;
//       });
      
//       return {
//         userId: user.id,
//         name: user.name,
//         metrics: {
//           totalAssigned,
//           completed,
//           completionRate,
//           cardsByStatus
//         }
//       };
//     });
    
//     // Sort by completion rate
//     teamMetrics.sort((a, b) => b.metrics.completionRate - a.metrics.completionRate);
    
//     return NextResponse.json({
//       teamMetrics
//     });
//   } catch (error) {
//     console.error("[TEAM_ANALYTICS_ERROR]", error);
//     return new NextResponse("Internal Error", { status: 500 });
//   }
// }

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
    
    // Get URL parameters for date filtering (consistent with other routes)
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
   
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
   
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
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
   
    if (!workspace) {
      return new NextResponse("Workspace not found", { status: 404 });
    }
   
    // Get all users in the workspace including the owner
    const workspaceUsers = [
      { 
        id: workspace.userId, 
        name: workspace.user?.name || workspace.user?.email || "Owner",
        email: workspace.user?.email || ""
      },
      ...workspace.members.map(member => ({
        id: member.user.id,
        name: member.user.name || member.user.email || "User",
        email: member.user.email || ""
      }))
    ];
   
    // Get all cards for the workspace with date filtering
    const cards = await prisma.card.findMany({
      where: {
        list: {
          board: {
            workspaceId
          }
        },
        // Apply date filter to cards created or updated within the range
        OR: [
          {
            createdAt: {
              gte: start,
              lte: end
            }
          },
          {
            updatedAt: {
              gte: start,
              lte: end
            }
          }
        ]
      },
      include: {
        assignees: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('Team Analytics Debug:', {
      workspaceId,
      workspaceUsersCount: workspaceUsers.length,
      totalCards: cards.length,
      dateRange: { start, end }
    });
   
    // Calculate metrics for each user
    const teamMetrics = workspaceUsers.map(user => {
      const userCards = cards.filter(card =>
        card.assignees.some(assignee => assignee.id === user.id)
      );
     
      const totalAssigned = userCards.length;
      const completed = userCards.filter(card => card.completed).length;
      const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;
     
      // Initialize with all possible statuses (adjust these to match your actual enum)
      const cardsByStatus = {
        BACKLOG: 0,
        TODO: 0,
        IN_PROGRESS: 0,
        IN_REVIEW: 0,
        DONE: 0
      };
     
      userCards.forEach(card => {
        // Make sure the status exists in our object before incrementing
        if (cardsByStatus.hasOwnProperty(card.status)) {
          cardsByStatus[card.status as keyof typeof cardsByStatus]++;
        }
      });

      // Calculate additional metrics
      const inProgress = cardsByStatus.IN_PROGRESS + cardsByStatus.IN_REVIEW;
      const pending = cardsByStatus.BACKLOG + cardsByStatus.TODO;
     
      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        metrics: {
          totalAssigned,
          completed,
          completionRate,
          inProgress,
          pending,
          cardsByStatus
        }
      };
    });
   
    // Sort by completion rate (descending), then by total assigned (descending)
    teamMetrics.sort((a, b) => {
      if (b.metrics.completionRate !== a.metrics.completionRate) {
        return b.metrics.completionRate - a.metrics.completionRate;
      }
      return b.metrics.totalAssigned - a.metrics.totalAssigned;
    });

    // Calculate team-wide statistics
    const teamStats = {
      totalMembers: workspaceUsers.length,
      totalCards: cards.length,
      totalCompleted: cards.filter(card => card.completed).length,
      averageCompletionRate: teamMetrics.length > 0 
        ? Math.round(teamMetrics.reduce((sum, member) => sum + member.metrics.completionRate, 0) / teamMetrics.length)
        : 0,
      mostProductiveMember: teamMetrics.length > 0 ? teamMetrics[0].name : null
    };
   
    return NextResponse.json({
      teamMetrics,
      teamStats,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });
  } catch (error) {
    console.error("[TEAM_ANALYTICS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}