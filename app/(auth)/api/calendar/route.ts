// app/api/calendar/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const boardId = searchParams.get("boardId"); // Optional filter by board

    if (!userId) {
      return new NextResponse("Missing userId", { status: 400 });
    }

    // Base query conditions
    const userCondition = {
      list: {
        board: {
          workspace: {
            OR: [
              { userId: session.user.id },
              {
                members: {
                  some: {
                    userId: session.user.id
                  }
                }
              }
            ]
          }
        }
      }
    };

    // Optional date filtering conditions
    const dateCondition = startDate && endDate ? {
      dueDate: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    // Optional board filtering
    const boardCondition = boardId ? {
      list: {
        boardId
      }
    } : {};

    // Fetch cards with due dates
    const cards = await prisma.card.findMany({
      where: {
        ...userCondition,
        ...dateCondition,
        ...boardCondition,
        dueDate: { not: null }
      },
      include: {
        list: {
          select: {
            id: true,
            title: true,
            board: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        assignees: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("[CALENDAR_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Update multiple cards (for drag-and-drop on calendar)
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updates = await req.json();
    
    if (!Array.isArray(updates)) {
      return new NextResponse("Invalid format: expected array of updates", { status: 400 });
    }

    const results = [];

    for (const update of updates) {
      const { id, dueDate } = update;
      
      if (!id) {
        results.push({ error: "Missing card ID", success: false });
        continue;
      }

      // Verify ownership/access
      const card = await prisma.card.findUnique({
        where: { id },
        include: {
          list: {
            include: {
              board: {
                include: {
                  workspace: {
                    include: {
                      members: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!card) {
        results.push({ id, error: "Card not found", success: false });
        continue;
      }

      // Check if user has access to this card
      const workspace = card.list.board.workspace;
      const hasAccess = 
        workspace.userId === session.user.id || 
        workspace.members.some(member => member.userId === session.user.id);

      if (!hasAccess) {
        results.push({ id, error: "Access denied", success: false });
        continue;
      }

      // Update the card
      const updatedCard = await prisma.card.update({
        where: { id },
        data: {
          dueDate: dueDate ? new Date(dueDate) : null
        }
      });

      results.push({ id, success: true, data: updatedCard });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[CALENDAR_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}