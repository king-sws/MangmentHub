// // api/lists/archive/route.ts - List Archive/Unarchive with Permission System
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { auth } from "@/auth";
// import { z } from "zod";
// import { requirePermission, getUserWorkspaceRole } from "@/lib/permission";

// const listArchiveSchema = z.object({
//   listId: z.string().min(1),
//   archive: z.boolean(), // true to archive, false to unarchive
// });

// export async function POST(req: Request) {
//   try {
//     const session = await auth();
//     if (!session?.user?.id) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }

//     const userId = session.user.id;

//     // Get and validate the request body
//     const body = await req.json();
//     const validatedData = listArchiveSchema.safeParse(body);
   
//     if (!validatedData.success) {
//       return new NextResponse(
//         JSON.stringify({ error: validatedData.error.errors }),
//         { status: 400, headers: { 'Content-Type': 'application/json' } }
//       );
//     }

//     const { listId, archive } = validatedData.data;

//     // Get the list with workspace info for permission check
//     const list = await prisma.list.findUnique({
//       where: { id: listId },
//       include: {
//         board: {
//           include: {
//             workspace: true
//           }
//         },
//         _count: {
//           select: {
//             cards: true
//           }
//         }
//       }
//     });

//     if (!list) {
//       return new NextResponse("List not found", { status: 404 });
//     }

//     const workspaceId = list.board.workspaceId;

//     // Check permissions - use EDIT_LIST permission for archiving
//     const permissionCheck = await requirePermission(userId, workspaceId, 'EDIT_LIST');
    
//     if (!permissionCheck.success) {
//       return new NextResponse(
//         permissionCheck.error || "Cannot archive/unarchive lists in this workspace", 
//         { status: permissionCheck.status || 403 }
//       );
//     }

//     // Update the list's archived status
//     const updatedList = await prisma.list.update({
//       where: { id: listId },
//       data: { 
//         archived: archive,
//         archivedAt: archive ? new Date() : null
//       },
//       include: {
//         _count: {
//           select: {
//             cards: true
//           }
//         }
//       }
//     });

//     const action = archive ? "archived" : "unarchived";
//     const message = `List ${action} successfully`;

//     console.log(`[LIST_ARCHIVE] List "${list.title}" ${action} by user ${userId} (role: ${await getUserWorkspaceRole(userId, workspaceId)})`);

//     return NextResponse.json({
//       success: true,
//       message,
//       list: updatedList,
//       action: archive ? "archived" : "unarchived"
//     });

//   } catch (error) {
//     console.error("[LIST_ARCHIVE]", error);
//     return new NextResponse(
//       JSON.stringify({ error: "Internal server error" }),
//       { status: 500, headers: { 'Content-Type': 'application/json' } }
//     );
//   }
// }

// // Get archived lists for a board
// export async function GET(req: Request) {
//   try {
//     const session = await auth();
//     if (!session?.user?.id) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }

//     const { searchParams } = new URL(req.url);
//     const boardId = searchParams.get("boardId");
//     const userId = session.user.id;

//     if (!boardId) {
//       return new NextResponse("Missing boardId", { status: 400 });
//     }

//     // Verify board exists and get workspace info
//     const board = await prisma.board.findUnique({
//       where: { id: boardId },
//       include: { 
//         workspace: {
//           include: {
//             members: true
//           }
//         }
//       },
//     });

//     if (!board) {
//       return new NextResponse("Board not found", { status: 404 });
//     }

//     const workspaceId = board.workspaceId;

//     // Check permissions - use VIEW_BOARD permission
//     const permissionCheck = await requirePermission(userId, workspaceId, 'VIEW_BOARD');
    
//     if (!permissionCheck.success) {
//       return new NextResponse(
//         permissionCheck.error || "Cannot view this board", 
//         { status: permissionCheck.status || 403 }
//       );
//     }

//     // Get archived lists for the board
//     const archivedLists = await prisma.list.findMany({
//       where: {
//         boardId,
//         archived: true
//       },
//       orderBy: {
//         archivedAt: "desc"
//       },
//       include: {
//         _count: {
//           select: {
//             cards: true
//           }
//         }
//       }
//     });

//     console.log(`[LIST_ARCHIVE_GET] Found ${archivedLists.length} archived lists for board ${boardId} by user ${userId} (role: ${await getUserWorkspaceRole(userId, workspaceId)})`);

//     return NextResponse.json({
//       archivedLists,
//       userRole: await getUserWorkspaceRole(userId, workspaceId)
//     });

//   } catch (error) {
//     console.error("[LIST_ARCHIVE_GET]", error);
//     return new NextResponse("Internal error", { status: 500 });
//   }
// }