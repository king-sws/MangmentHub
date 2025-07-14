// import { NextResponse } from "next/server";
// import { auth } from "@/auth";
// import { prisma } from "@/lib/prisma";

// export async function GET(req: Request) {
//   try {
//     const session = await auth();
    
//     if (!session?.user?.email) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }
    
//     const userId = session.user.id;
    
//     // Get date range from query parameters if present
//     const url = new URL(req.url);
//     const startDateParam = url.searchParams.get('startDate');
//     const endDateParam = url.searchParams.get('endDate');
    
//     const startDate = startDateParam ? new Date(startDateParam) : undefined;
//     const endDate = endDateParam ? new Date(endDateParam) : undefined;
    
//     // Get cards assigned to user with date range filter if specified
//     const assignedCards = await prisma.card.findMany({
//       where: {
//         assignees: {
//           some: {
//             id: userId
//           }
//         },
//         ...(startDate && {
//           createdAt: {
//             gte: startDate
//           }
//         }),
//         ...(endDate && {
//           createdAt: {
//             lte: endDate
//           }
//         })
//       },
//       include: {
//         list: {
//           include: {
//             board: {
//               include: {
//                 workspace: true
//               }
//             }
//           }
//         }
//       }
//     });
    
//     // Calculate user metrics
//     const totalAssigned = assignedCards.length;
//     const completedCards = assignedCards.filter(card => card.completed).length;
//     const completionRate = totalAssigned > 0 ? (completedCards / totalAssigned) * 100 : 0;
    
//     // Cards by status
//     const cardsByStatus = {
//       BACKLOG: 0,
//       TODO: 0,
//       IN_PROGRESS: 0,
//       IN_REVIEW: 0,
//       DONE: 0
//     };
    
//     assignedCards.forEach(card => {
//       cardsByStatus[card.status]++;
//     });
    
//     // Calculate cards due soon (this week)
//     const today = new Date();
//     const endOfWeek = new Date(today);
//     endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    
//     const cardsDueSoon = assignedCards.filter(card => 
//       card.dueDate &&
//       new Date(card.dueDate) <= endOfWeek &&
//       !card.completed
//     ).length;
    
//     // Calculate cards by workspace
//     const cardsByWorkspace: {
//       [workspaceId: string]: {
//         name: string;
//         total: number;
//         completed: number;
//       };
//     } = {};
    
//     assignedCards.forEach(card => {
//       const workspaceId = card.list.board.workspace.id;
//       const workspaceName = card.list.board.workspace.name;
      
//       if (!cardsByWorkspace[workspaceId]) {
//         cardsByWorkspace[workspaceId] = {
//           name: workspaceName,
//           total: 0,
//           completed: 0
//         };
//       }
      
//       cardsByWorkspace[workspaceId].total++;
      
//       if (card.completed) {
//         cardsByWorkspace[workspaceId].completed++;
//       }
//     });
    
//     return NextResponse.json({
//       overview: {
//         totalAssigned,
//         completedCards,
//         completionRate,
//         cardsDueSoon
//       },
//       cardsByStatus,
//       cardsByWorkspace: Object.keys(cardsByWorkspace).map(id => ({
//         workspaceId: id,
//         ...cardsByWorkspace[id]
//       })),
//       timestamp: new Date()
//     });
//   } catch (error) {
//     console.error("[USER_ANALYTICS_ERROR]", error);
//     return new NextResponse("Internal Error", { status: 500 });
//   }
// }


// /app/(auth)/api/analytics/user/route.ts
// import { NextResponse } from "next/server";
// import { auth } from "@/auth";
// import { prisma } from "@/lib/prisma";

// export async function GET(req: Request) {
//   try {
//     const session = await auth();
   
//     if (!session?.user?.email) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }
   
//     const userId = session.user.id;
   
//     // Get date range from query parameters if present
//     const url = new URL(req.url);
//     const startDateParam = url.searchParams.get('startDate');
//     const endDateParam = url.searchParams.get('endDate');
   
//     const startDate = startDateParam ? new Date(startDateParam) : undefined;
//     const endDate = endDateParam ? new Date(endDateParam) : undefined;
   
//     // Get cards assigned to user with date range filter if specified
//     const assignedCards = await prisma.card.findMany({
//       where: {
//         assignees: {
//           some: {
//             id: userId
//           }
//         },
//         ...(startDate && {
//           createdAt: {
//             gte: startDate
//           }
//         }),
//         ...(endDate && {
//           createdAt: {
//             lte: endDate
//           }
//         })
//       },
//       include: {
//         list: {
//           include: {
//             board: {
//               include: {
//                 workspace: true
//               }
//             }
//           }
//         }
//       }
//     });
   
//     // Calculate user metrics
//     const totalAssigned = assignedCards.length;
//     const completedCards = assignedCards.filter(card => card.completed).length;
//     const completionRate = totalAssigned > 0 ? (completedCards / totalAssigned) * 100 : 0;
   
//     // Cards by status - Initialize with 0 for all statuses
//     const cardsByStatus = {
//       BACKLOG: 0,
//       TODO: 0,
//       IN_PROGRESS: 0,
//       IN_REVIEW: 0,
//       DONE: 0
//     };
   
//     // Count cards by status
//     assignedCards.forEach(card => {
//       // Make sure the status exists in our object before incrementing
//       if (card.status && cardsByStatus.hasOwnProperty(card.status)) {
//         cardsByStatus[card.status as keyof typeof cardsByStatus]++;
//       } else {
//         // Log any unexpected status values for debugging
//         console.warn(`Unexpected card status: ${card.status}`);
//       }
//     });
   
//     // Calculate cards due soon (this week)
//     const today = new Date();
//     const endOfWeek = new Date(today);
//     endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
   
//     const cardsDueSoon = assignedCards.filter(card =>
//       card.dueDate &&
//       new Date(card.dueDate) <= endOfWeek &&
//       !card.completed
//     ).length;
   
//     // Calculate cards by workspace
//     const cardsByWorkspace: {
//       [workspaceId: string]: {
//         name: string;
//         total: number;
//         completed: number;
//       };
//     } = {};
   
//     assignedCards.forEach(card => {
//       const workspaceId = card.list.board.workspace.id;
//       const workspaceName = card.list.board.workspace.name;
     
//       if (!cardsByWorkspace[workspaceId]) {
//         cardsByWorkspace[workspaceId] = {
//           name: workspaceName,
//           total: 0,
//           completed: 0
//         };
//       }
     
//       cardsByWorkspace[workspaceId].total++;
     
//       if (card.completed) {
//         cardsByWorkspace[workspaceId].completed++;
//       }
//     });

//     // Debug logging
//     console.log('User Analytics Debug:', {
//       totalAssigned,
//       completedCards,
//       cardsByStatus,
//       cardsDueSoon,
//       assignedCardsCount: assignedCards.length,
//       sampleCard: assignedCards[0] ? {
//         id: assignedCards[0].id,
//         status: assignedCards[0].status,
//         completed: assignedCards[0].completed
//       } : null
//     });
   
//     return NextResponse.json({
//       overview: {
//         totalAssigned,
//         completedCards,
//         completionRate,
//         cardsDueSoon
//       },
//       cardsByStatus,
//       cardsByWorkspace: Object.keys(cardsByWorkspace).map(id => ({
//         workspaceId: id,
//         ...cardsByWorkspace[id]
//       })),
//       timestamp: new Date()
//     });
//   } catch (error) {
//     console.error("[USER_ANALYTICS_ERROR]", error);
//     return new NextResponse("Internal Error", { status: 500 });
//   }
// }


// /app/(auth)/api/analytics/user/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Define the valid status types
type CardStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export async function GET(req: Request) {
  try {
    const session = await auth();
   
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
   
    const userId = session.user.id;
   
    // Get date range from query parameters if present
    const url = new URL(req.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
   
    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    console.log('User Analytics API - Date Range:', { startDate, endDate });
   
    // Get cards assigned to user with date range filter if specified
    const assignedCards = await prisma.card.findMany({
      where: {
        assignees: {
          some: {
            id: userId
          }
        },
        ...(startDate && endDate && {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        })
      },
      include: {
        list: {
          include: {
            board: {
              include: {
                workspace: true
              }
            }
          }
        }
      }
    });

    console.log('User Analytics API - Found cards:', assignedCards.length);
   
    // Calculate user metrics
    const totalAssigned = assignedCards.length;
    const completedCards = assignedCards.filter(card => card.completed).length;
    const completionRate = totalAssigned > 0 ? (completedCards / totalAssigned) * 100 : 0;
   
    // Cards by status - Initialize with 0 for all statuses
    const cardsByStatus: Record<CardStatus, number> = {
      BACKLOG: 0,
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0
    };
   
    // Count cards by status
    assignedCards.forEach(card => {
      const status = card.status as CardStatus;
      if (cardsByStatus.hasOwnProperty(status)) {
        cardsByStatus[status]++;
      } else {
        console.warn(`Unexpected card status: ${card.status} for card ID: ${card.id}`);
      }
    });
   
    // Calculate cards due soon (this week)
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
   
    const cardsDueSoon = assignedCards.filter(card =>
      card.dueDate &&
      new Date(card.dueDate) <= endOfWeek &&
      !card.completed
    ).length;
   
    // Calculate cards by workspace
    const cardsByWorkspace: {
      [workspaceId: string]: {
        name: string;
        total: number;
        completed: number;
      };
    } = {};
   
    assignedCards.forEach(card => {
      const workspaceId = card.list.board.workspace.id;
      const workspaceName = card.list.board.workspace.name;
     
      if (!cardsByWorkspace[workspaceId]) {
        cardsByWorkspace[workspaceId] = {
          name: workspaceName,
          total: 0,
          completed: 0
        };
      }
     
      cardsByWorkspace[workspaceId].total++;
     
      if (card.completed) {
        cardsByWorkspace[workspaceId].completed++;
      }
    });

    // Debug logging
    console.log('User Analytics API - Final data:', {
      totalAssigned,
      completedCards,
      completionRate,
      cardsByStatus,
      cardsDueSoon,
      workspacesCount: Object.keys(cardsByWorkspace).length
    });

    const response = {
      overview: {
        totalAssigned,
        completedCards,
        completionRate,
        cardsDueSoon
      },
      cardsByStatus,
      cardsByWorkspace: Object.keys(cardsByWorkspace).map(id => ({
        workspaceId: id,
        ...cardsByWorkspace[id]
      })),
      timestamp: new Date()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[USER_ANALYTICS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}