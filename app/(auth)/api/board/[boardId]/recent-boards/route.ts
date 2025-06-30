// // api/recent-boards/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@/auth";
// import { z } from "zod";

// const addRecentSchema = z.object({
//   boardId: z.string().cuid("Invalid board ID"),
// });

// // GET recent boards for current user
// export async function GET(req: Request) {
//   try {
//     const session = await auth();
//     const userId = session?.user?.id;

//     if (!userId) {
//       return NextResponse.json(
//         { error: "Authentication required" },
//         { status: 401 }
//       );
//     }

//     const { searchParams } = new URL(req.url);
//     const workspaceId = searchParams.get("workspaceId");
//     const limit = parseInt(searchParams.get("limit") || "10");

//     // Base query for recent boards
//     let whereClause: any = {
//       userId,
//     };

//     // If workspaceId is provided, filter by workspace
//     if (workspaceId) {
//       whereClause.board = {
//         workspaceId,
//       };
//     }

//     const recentBoards = await prisma.recentBoard.findMany({
//       where: whereClause,
//       include: {
//         board: {
//           include: {
//             workspace: {
//               select: {
//                 id: true,
//                 name: true,
//                 userId: true,
//               },
//             },
//             lists: {
//               include: {
//                 _count: {
//                   select: {
//                     cards: true,
//                   },
//                 },
//               },
//             },
//             _count: {
//               select: {
//                 lists: true,
//               },
//             },
//             starredBy: {
//               where: { userId },
//               select: { id: true },
//             },
//           },
//         },
//       },
//       orderBy: {
//         viewedAt: "desc",
//       },
//       take: limit,
//     });

//     // Transform the data to include computed stats
//     const boardsWithStats = recentBoards.map(({ board, viewedAt }) => ({
//       ...board,
//       lastViewedAt: viewedAt,
//       totalCards: board.lists.reduce((acc, list) => acc + list._count.cards, 0),
//       totalLists: board._count.lists,
//       isStarred: board.starredBy.length > 0,
//     }));

//     return NextResponse.json({
//       success: true,
//       data: boardsWithStats,
//       count: recentBoards.length,
//     });
//   } catch (error) {
//     console.error("[RECENT_BOARDS_GET]", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// // POST to add/update recent board
// export async function POST(req: Request) {
//   try {
//     const session = await auth();
//     const userId = session?.user?.id;

//     if (!userId) {
//       return NextResponse.json(
//         { error: "Authentication required" },
//         { status: 401 }
//       );
//     }

//     const body = await req.json();
//     const validation = addRecentSchema.safeParse(body);

//     if (!validation.success) {
//       return NextResponse.json(
//         { 
//           error: "Validation failed", 
//           details: validation.error.errors 
//         },
//         { status: 400 }
//       );
//     }

//     const { boardId } = validation.data;

//     // Check if board exists and user has access
//     const board = await prisma.board.findUnique({
//       where: { id: boardId },
//       include: {
//         workspace: {
//           include: {
//             members: {
//               where: { userId },
//             },
//           },
//         },
//       },
//     });

//     if (!board) {
//       return NextResponse.json(
//         { error: "Board not found" },
//         { status: 404 }
//       );
//     }

//     // Check if user has access to the board
//     const isOwner = board.workspace.userId === userId;
//     const isMember = board.workspace.members.length > 0;

//     if (!isOwner && !isMember) {
//       return NextResponse.json(
//         { error: "Access denied" },
//         { status: 403 }
//       );
//     }

//     // Upsert recent board (create or update viewedAt)
//     await prisma.recentBoard.upsert({
//       where: {
//         userId_boardId: {
//           userId,
//           boardId,
//         },
//       },
//       update: {
//         viewedAt: new Date(),
//       },
//       create: {
//         userId,
//         boardId,
//         viewedAt: new Date(),
//       },
//     });

//     // Keep only the last 50 recent boards per user to prevent unlimited growth
//     const recentCount = await prisma.recentBoard.count({
//       where: { userId },
//     });

//     if (recentCount > 50) {
//       const oldestRecent = await prisma.recentBoard.findMany({
//         where: { userId },
//         orderBy: { viewedAt: "asc" },
//         take: recentCount - 50,
//       });

//       await prisma.recentBoard.deleteMany({
//         where: {
//           id: {
//             in: oldestRecent.map(r => r.id),
//           },
//         },
//       });
//     }

//     return NextResponse.json({
//       success: true,
//       data: {
//         boardId,
//         viewedAt: new Date(),
//       },
//       message: "Recent board updated successfully",
//     });
//   } catch (error) {
//     console.error("[RECENT_BOARDS_POST]", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }