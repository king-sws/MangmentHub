// // api/starred-boards/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@/auth";
// import { z } from "zod";

// const toggleStarSchema = z.object({
//   boardId: z.string().cuid("Invalid board ID"),
// });

// // GET starred boards for current user
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

//     // Base query for starred boards
//     let whereClause: any = {
//       userId,
//     };

//     // If workspaceId is provided, filter by workspace
//     if (workspaceId) {
//       whereClause.board = {
//         workspaceId,
//       };
//     }

//     const starredBoards = await prisma.starredBoard.findMany({
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
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     // Transform the data to include computed stats
//     const boardsWithStats = starredBoards.map(({ board, createdAt }) => ({
//       ...board,
//       starredAt: createdAt,
//       totalCards: board.lists.reduce((acc, list) => acc + list._count.cards, 0),
//       totalLists: board._count.lists,
//       isStarred: true,
//     }));

//     return NextResponse.json({
//       success: true,
//       data: boardsWithStats,
//       count: starredBoards.length,
//     });
//   } catch (error) {
//     console.error("[STARRED_BOARDS_GET]", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// // POST to toggle star status
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
//     const validation = toggleStarSchema.safeParse(body);

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

//     // Check if already starred
//     const existingStarred = await prisma.starredBoard.findUnique({
//       where: {
//         userId_boardId: {
//           userId,
//           boardId,
//         },
//       },
//     });

//     let isStarred = false;

//     if (existingStarred) {
//       // Remove star
//       await prisma.starredBoard.delete({
//         where: {
//           id: existingStarred.id,
//         },
//       });
//       isStarred = false;
//     } else {
//       // Add star
//       await prisma.starredBoard.create({
//         data: {
//           userId,
//           boardId,
//         },
//       });
//       isStarred = true;
//     }

//     return NextResponse.json({
//       success: true,
//       data: {
//         boardId,
//         isStarred,
//       },
//       message: isStarred ? "Board starred successfully" : "Board unstarred successfully",
//     });
//   } catch (error) {
//     console.error("[STARRED_BOARDS_POST]", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }