// // /app/(auth)/api/analytics/trends/route.ts
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
    
//     // Get URL parameters
//     const url = new URL(req.url);
//     const startDate = url.searchParams.get('startDate');
//     const endDate = url.searchParams.get('endDate');
    
//     const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
//     const end = endDate ? new Date(endDate) : new Date();
    
//     // Get all cards created by user and organized by date
//     const cards = await prisma.card.findMany({
//       where: {
//         createdAt: {
//           gte: start,
//           lte: end
//         },
//         list: {
//           board: {
//             workspace: {
//               OR: [
//                 { userId },
//                 { members: { some: { userId } } }
//               ]
//             }
//           }
//         }
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
//       },
//       orderBy: {
//         createdAt: 'asc'
//       }
//     });
    
//     // Group cards by date (format: YYYY-MM-DD)
//     const cardsByDate: Record<string, number> = {};
//     const completedByDate: Record<string, number> = {};
    
//     cards.forEach(card => {
//       const dateStr = card.createdAt.toISOString().split('T')[0];
      
//       // Count cards created by date
//       if (!cardsByDate[dateStr]) {
//         cardsByDate[dateStr] = 0;
//       }
//       cardsByDate[dateStr]++;
      
//       // Count cards completed by date (if completed)
//       if (card.completed && card.completedAt) {
//         const completedDateStr = card.completedAt.toISOString().split('T')[0];
//         if (!completedByDate[completedDateStr]) {
//           completedByDate[completedDateStr] = 0;
//         }
//         completedByDate[completedDateStr]++;
//       }
//     });
    
//     // Generate daily series for date range
//     const trendData = [];
//     const currentDate = new Date(start);
    
//     while (currentDate <= end) {
//       const dateStr = currentDate.toISOString().split('T')[0];
      
//       trendData.push({
//         date: dateStr,
//         created: cardsByDate[dateStr] || 0,
//         completed: completedByDate[dateStr] || 0
//       });
      
//       // Move to next day
//       currentDate.setDate(currentDate.getDate() + 1);
//     }
    
//     return NextResponse.json({
//       trendData,
//       aggregated: {
//         totalCreated: cards.length,
//         totalCompleted: cards.filter(card => card.completed).length
//       }
//     });
//   } catch (error) {
//     console.error("[ANALYTICS_TRENDS_ERROR]", error);
//     return new NextResponse("Internal Error", { status: 500 });
//   }
// }

// /app/(auth)/api/analytics/trends/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
   
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
   
    const userId = session.user.id;
   
    // Get URL parameters
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
   
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
   
    // Get all cards in user's workspaces created within the date range
    const cards = await prisma.card.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        list: {
          board: {
            workspace: {
              OR: [
                { userId },
                { members: { some: { userId } } }
              ]
            }
          }
        }
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
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Also get cards that were completed within the date range (even if created before)
    const completedCards = await prisma.card.findMany({
      where: {
        completed: true,
        // If you have a completedAt field, use it. Otherwise, use updatedAt as a proxy
        ...(await prisma.card.findFirst({
          select: { completedAt: true }
        }).then(result => 
          result && 'completedAt' in result 
            ? { completedAt: { gte: start, lte: end } }
            : { 
                updatedAt: { gte: start, lte: end },
                completed: true
              }
        )),
        list: {
          board: {
            workspace: {
              OR: [
                { userId },
                { members: { some: { userId } } }
              ]
            }
          }
        }
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
   
    // Group cards by date (format: YYYY-MM-DD)
    const cardsByDate: Record<string, number> = {};
    const completedByDate: Record<string, number> = {};
   
    // Count cards created by date
    cards.forEach(card => {
      const dateStr = card.createdAt.toISOString().split('T')[0];
      
      if (!cardsByDate[dateStr]) {
        cardsByDate[dateStr] = 0;
      }
      cardsByDate[dateStr]++;
    });

    // Count cards completed by date
    completedCards.forEach(card => {
      // Use completedAt if available, otherwise use updatedAt
      const completedDate = (card as any).completedAt || card.updatedAt;
      const completedDateStr = completedDate.toISOString().split('T')[0];
      
      if (!completedByDate[completedDateStr]) {
        completedByDate[completedDateStr] = 0;
      }
      completedByDate[completedDateStr]++;
    });
   
    // Generate daily series for date range
    const trendData = [];
    const currentDate = new Date(start);
   
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
     
      trendData.push({
        date: dateStr,
        created: cardsByDate[dateStr] || 0,
        completed: completedByDate[dateStr] || 0
      });
     
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
   
    // Calculate totals
    const totalCreated = cards.length;
    const totalCompleted = completedCards.length;

    console.log('Trends API Debug:', {
      totalCreated,
      totalCompleted,
      trendDataLength: trendData.length,
      sampleTrendData: trendData.slice(0, 3)
    });
   
    return NextResponse.json({
      trendData,
      aggregated: {
        totalCreated,
        totalCompleted
      }
    });
  } catch (error) {
    console.error("[ANALYTICS_TRENDS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}